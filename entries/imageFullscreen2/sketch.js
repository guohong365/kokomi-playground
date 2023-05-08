import * as kokomi from "kokomi.js";
import * as THREE from "three";
import gsap from "gsap";
import * as dat from "lil-gui";

class Sketch extends kokomi.Base {
  async create() {
    const screenCamera = new kokomi.ScreenCamera(this);
    screenCamera.addExisting();

    const gallary = new kokomi.Gallery(this, {
      vertexShader,
      fragmentShader,
      isScrollPositionSync: false,
      uniforms: {
        uMeshSize: {
          value: new THREE.Vector2(0, 0),
        },
        uMeshPosition: {
          value: new THREE.Vector2(0, 0),
        },
        uProgress: {
          value: 0,
        },
      },
      makuConfig: {
        segments: {
          width: 60,
          height: 30,
        },
      },
    });
    await gallary.addExisting();

    // horizontal infinite scroll
    const wheelScroller = new kokomi.WheelScroller();
    wheelScroller.listenForScroll();

    const gap = 64;

    const syncGallery = () => {
      wheelScroller.syncScroll();

      if (gallary.makuGroup) {
        const imgWidth = gallary.makuGroup.makus[0].el.clientWidth;

        const totalWidth = (imgWidth + gap) * gallary.makuGroup.makus.length;

        gallary.makuGroup.makus.forEach((maku, i) => {
          maku.mesh.position.x =
            (((imgWidth + gap) * i -
              wheelScroller.scroll.current -
              114514 * totalWidth) %
              totalWidth) +
            (imgWidth + gap) * 3;
        });
      }
    };

    this.update(() => {
      syncGallery();
    });

    // mesh info
    this.update(() => {
      if (gallary.makuGroup) {
        gallary.makuGroup.makus.forEach((maku) => {
          maku.mesh.material.uniforms.uMeshSize.value = new THREE.Vector2(
            maku.el.clientWidth,
            maku.el.clientHeight
          );
          maku.mesh.material.uniforms.uMeshPosition.value = new THREE.Vector2(
            maku.mesh.position.x,
            maku.mesh.position.y
          );
        });
      }
    });

    // transition
    const duration = 2.5;

    const doTransition = (mesh) => {
      document.body.classList.add("overflow-hidden");
      gsap.to(mesh.material.uniforms.uProgress, {
        value: 1,
        duration,
        ease: "power3.out",
      });
    };

    const undoTransition = (mesh) => {
      document.body.classList.remove("overflow-hidden");
      gsap.to(mesh.material.uniforms.uProgress, {
        value: 0,
        duration,
        ease: "power3.out",
      });
    };

    let currentFullscreenMesh = null;

    gallary.makuGroup.makus.forEach((maku) => {
      this.interactionManager.add(maku.mesh);

      maku.mesh.addEventListener("click", () => {
        console.log("click");
        if (!currentFullscreenMesh) {
          const progress = maku.mesh.material.uniforms.uProgress.value;
          if (progress < 0.5) {
            doTransition(maku.mesh);
            currentFullscreenMesh = maku.mesh;
          }
        }
      });
    });

    this.container.addEventListener("click", () => {
      if (currentFullscreenMesh) {
        const progress =
          currentFullscreenMesh.material.uniforms.uProgress.value;
        if (progress > 0.01) {
          undoTransition(currentFullscreenMesh);
          currentFullscreenMesh = null;
        }
      }
    });

    // simulate postprocessing
    const rq = new kokomi.RenderQuad(this);
    rq.mesh.position.z = 1;
    rq.addExisting();

    const mat = new kokomi.MeshTransmissionMaterial(this, rq.mesh, {
      saturation: 1,
      backside: false,
      chromaticAberration: 0.06,
      refraction: 0.7,
    });
    rq.mesh.material = mat.material;
  }
}
