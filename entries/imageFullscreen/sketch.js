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
    });
    await gallary.addExisting();

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
    const duration = 1;

    const doTransition = (mesh) => {
      document.body.classList.add("overflow-hidden");
      gsap.to(mesh.material.uniforms.uProgress, {
        value: 1,
        duration,
        ease: "power2.out",
      });
    };

    const undoTransition = (mesh) => {
      document.body.classList.remove("overflow-hidden");
      gsap.to(mesh.material.uniforms.uProgress, {
        value: 0,
        duration,
        ease: "power2.inOut",
      });
    };

    let currentFullscreenMesh = null;

    gallary.makuGroup.makus.forEach((maku) => {
      this.interactionManager.add(maku.mesh);

      maku.el.addEventListener("click", () => {
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
  }
}
