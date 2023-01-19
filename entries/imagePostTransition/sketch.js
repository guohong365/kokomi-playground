import * as kokomi from "kokomi.js";
import * as THREE from "three";
import gsap from "gsap";
import * as dat from "lil-gui";

class Sketch extends kokomi.Base {
  async create() {
    const screenCamera = new kokomi.ScreenCamera(this);
    screenCamera.addExisting();

    // new kokomi.OrbitControls(this);

    const maskTex = new THREE.TextureLoader().load(
      "https://s2.loli.net/2022/10/10/2E9SydXQLIzRlxV.jpg"
    );

    const gallary = new kokomi.Gallery(this, {
      vertexShader,
      fragmentShader,
    });
    await gallary.addExisting();

    // shadows
    const zDelta = 50;
    const shadowCount = 3;

    const gs = gallary.makuGroup.makus.map((maku, i) => {
      const g = new THREE.Group();
      this.scene.add(g);

      g.add(maku.mesh);

      const cms = [...Array(shadowCount).keys()].map((item, j) => {
        const cm = new kokomi.RenderQuad(
          this,
          maku.mesh.material.uniforms.uTexture.value,
          {
            geometry: maku.mesh.geometry,
            materialParams: {
              alphaMap: maskTex,
            },
          }
        );
        cm.addExisting();
        g.add(cm.mesh);
        return cm;
      });

      cms.forEach((cm, k) => {
        cm.mesh.position.z = k * zDelta;
      });

      return g;
    });

    // tilt with inertia
    let offsetX = 0;
    let offsetY = 0;

    this.update(() => {
      const { x, y } = this.interactionManager.mouse;

      offsetX = THREE.MathUtils.lerp(offsetX, x, 0.1);
      offsetY = THREE.MathUtils.lerp(offsetY, y, 0.1);

      gs.forEach((g) => {
        g.rotation.x = -0.1 * offsetY;
        g.rotation.y = 0.1 * offsetX;
      });
    });

    // offset x
    const gap = 0;
    const interval = gallary.makuGroup.makus[0].el.clientWidth + gap;

    gs.forEach((g, i) => {
      g.position.x = interval * i;
    });

    // post
    const params = {
      curtain: 0,
      RGBShift: 0,
    };
    this.params = params;

    const customEffect = new kokomi.CustomEffect(this, {
      vertexShader: vertexShader2,
      fragmentShader: fragmentShader2,
      uniforms: {
        uCurtain: {
          value: params.curtain,
        },
        uRGBShift: {
          value: params.RGBShift,
        },
      },
    });
    customEffect.addExisting();
    this.customEffect = customEffect;

    // transition
    let canGotoNextImage = true;
    let currentIndex = 0;

    const imageTransition = (direction = "+") => {
      return new Promise((resolve, reject) => {
        if (!canGotoNextImage) {
          reject();
          return;
        }
        canGotoNextImage = false;

        const t1 = gsap.timeline();

        // x
        t1.to(this.camera.position, {
          x: `${direction}=${interval}`,
          duration: 1.5,
          ease: "power4.inOut",
          onComplete() {
            canGotoNextImage = true;
            resolve(true);
          },
        });

        // z
        t1.to(
          this.camera.position,
          {
            z: `-=200`,
            duration: 1,
            ease: "power4.inOut",
          },
          0
        ).to(
          this.camera.position,
          {
            z: `+=200`,
            duration: 1,
            ease: "power4.inOut",
          },
          1
        );

        // curtain effect
        t1.to(
          customEffect.customPass.material.uniforms.uCurtain,
          {
            value: 1,
            duration: 1,
            ease: "power3.inOut",
          },
          0
        ).to(
          customEffect.customPass.material.uniforms.uCurtain,
          {
            value: 0,
            duration: 1,
            ease: "power3.inOut",
          },
          1
        );

        // RGBShift effect
        t1.to(
          customEffect.customPass.material.uniforms.uRGBShift,
          {
            value: 1,
            duration: 1,
            ease: "power3.inOut",
          },
          0
        ).to(
          customEffect.customPass.material.uniforms.uRGBShift,
          {
            value: 0,
            duration: 1,
            ease: "power3.inOut",
          },
          1
        );
      });
    };

    const nextImage = async () => {
      if (currentIndex + 1 > gallary.makuGroup.makus.length - 1) {
        return;
      }
      await imageTransition("+");
      currentIndex += 1;
    };

    const prevImage = async () => {
      if (currentIndex - 1 < 0) {
        return;
      }
      await imageTransition("-");
      currentIndex -= 1;
    };

    window.addEventListener("wheel", (e) => {
      const deltaY = e.deltaY;
      if (deltaY > 0) {
        nextImage();
      } else {
        prevImage();
      }
    });

    // oscillator
    this.update(() => {
      const t = this.clock.elapsedTime;

      const oscillator = Math.sin(t * 0.5) * 0.5 + 0.5;

      gs.forEach((g) => {
        g.children.forEach((mesh, i) => {
          mesh.position.z = (i + 1) * zDelta - oscillator * zDelta * 2;
        });
      });
    });

    // this.createDebug();
  }
  createDebug() {
    const params = this.params;
    const customEffect = this.customEffect;

    const gui = new dat.GUI();
    gui
      .add(params, "curtain")
      .min(0)
      .max(1)
      .step(0.01)
      .onChange((val) => {
        customEffect.customPass.material.uniforms.uCurtain.value = val;
      });
    gui
      .add(params, "RGBShift")
      .min(0)
      .max(1)
      .step(0.01)
      .onChange((val) => {
        customEffect.customPass.material.uniforms.uRGBShift.value = val;
      });
  }
}
