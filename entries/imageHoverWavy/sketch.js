import * as kokomi from "kokomi.js";
import * as THREE from "three";
import gsap from "gsap";
import * as dat from "lil";

class Sketch extends kokomi.Base {
  async create() {
    const screenCamera = new kokomi.ScreenCamera(this);
    screenCamera.addExisting();

    const gallary = new kokomi.Gallery(this, {
      vertexShader,
      fragmentShader,
      uniforms: {
        uHoverState: {
          value: 0,
        },
        uHoverUv: {
          value: new THREE.Vector2(0, 0),
        },
      },
      makuConfig: {
        segments: {
          width: 16,
          height: 16,
        },
      },
      isScrollPositionSync: false,
    });
    await gallary.addExisting();

    // hover
    gallary.makuGroup.makus.forEach((maku) => {
      maku.el.addEventListener("mouseenter", () => {
        gsap.to(maku.mesh.material.uniforms.uHoverState, {
          value: 1,
          duration: 1,
        });
        gsap.to(maku.mesh.scale, {
          x: 1.1,
        });
        gsap.to(maku.mesh.scale, {
          y: 1.1,
        });
        gsap.to(maku.mesh.scale, {
          z: 1.1,
        });
      });

      maku.el.addEventListener("mouseleave", () => {
        gsap.to(maku.mesh.material.uniforms.uHoverState, {
          value: 0,
          duration: 1,
        });
        gsap.to(maku.mesh.scale, {
          x: 1,
        });
        gsap.to(maku.mesh.scale, {
          y: 1,
        });
        gsap.to(maku.mesh.scale, {
          z: 1,
        });
      });
    });

    const rs = new kokomi.RaycastSelector(this);

    window.addEventListener("mousemove", () => {
      const intersect = rs.getFirstIntersect();
      if (intersect) {
        const obj = intersect.object;
        if (obj.material.uniforms) {
          obj.material.uniforms.uHoverUv.value = intersect.uv;
        }
      }
    });

    const gs = gallary.makuGroup.makus.map((maku, i) => {
      const g = new THREE.Group();
      this.scene.add(g);

      g.add(maku.mesh);

      return g;
    });

    // tilt with inertia
    let offsetX = 0;
    let offsetY = 0;

    this.update(() => {
      const { x, y } = this.interactionManager.mouse;

      offsetX = THREE.MathUtils.lerp(offsetX, x, 0.1);
      offsetY = THREE.MathUtils.lerp(offsetY, y, 0.1);

      gs.forEach((g, i) => {
        const hoverState =
          gallary.makuGroup.makus[i].mesh.material.uniforms.uHoverState.value;

        g.position.x = 10 * offsetX * hoverState;
        g.position.y = 10 * offsetY * hoverState;
      });
    });
  }
}
