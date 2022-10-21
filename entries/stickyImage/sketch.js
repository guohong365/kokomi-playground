import * as kokomi from "kokomi.js";
import * as THREE from "three";
import gsap from "gsap";
import * as dat from "lil";

class Sketch extends kokomi.Base {
  async create() {
    const screenCamera = new kokomi.ScreenCamera(this);
    screenCamera.addExisting();

    const params = {
      progress: 0,
      direction: 0.5,
      offset: 1000,
      waveIntensity: 0,
    };
    this.params = params;

    const gallary = new kokomi.Gallery(this, {
      vertexShader,
      fragmentShader,
      uniforms: {
        uProgress: {
          value: params.progress,
        },
        uDirection: {
          value: params.direction,
        },
        uOffset: {
          value: params.offset,
        },
        uWaveIntensity: {
          value: params.waveIntensity,
        },
      },
    });
    await gallary.addExisting();
    this.gallary = gallary;

    const duration = 1;
    const ease = "power2.out";

    const t1 = gsap.timeline();

    const doTransition = (mesh) => {
      t2.clear();
      t1.to(mesh.material.uniforms.uProgress, {
        value: 1,
        duration,
        ease,
      })
        .to(
          mesh.material.uniforms.uDirection,
          {
            value: 1,
            duration,
            ease,
          },
          0
        )
        .to(
          mesh.material.uniforms.uWaveIntensity,
          {
            value: 1,
            duration,
            ease,
          },
          0
        );
    };

    const t2 = gsap.timeline();

    const undoTransition = (mesh) => {
      t1.clear();
      t2.to(mesh.material.uniforms.uProgress, {
        value: 0,
        duration,
        ease,
      })
        .to(
          mesh.material.uniforms.uDirection,
          {
            value: 0.5,
            duration,
            ease,
          },
          0
        )
        .to(
          mesh.material.uniforms.uWaveIntensity,
          {
            value: 0,
            duration: 0,
            ease,
          },
          0
        );
    };

    gallary.makuGroup.makus.forEach((maku) => {
      this.interactionManager.add(maku.mesh);

      maku.mesh.addEventListener("click", () => {
        const progress = maku.mesh.material.uniforms.uProgress.value;
        if (progress < 0.5) {
          doTransition(maku.mesh);
        } else if (progress > 0.5) {
          undoTransition(maku.mesh);
        }
      });
    });

    // this.createDebug();
  }
  createDebug() {
    const params = this.params;
    const gallery = this.gallary;

    const gui = new dat.GUI();
    gui
      .add(params, "progress")
      .min(0)
      .max(1)
      .step(0.01)
      .onChange((value) => {
        gallery.makuGroup.makus.forEach((maku) => {
          maku.mesh.material.uniforms.uProgress.value = value;
        });
      });
    gui
      .add(params, "direction")
      .min(0)
      .max(1)
      .step(0.01)
      .onChange((value) => {
        gallery.makuGroup.makus.forEach((maku) => {
          maku.mesh.material.uniforms.uDirection.value = value;
        });
      });
    gui
      .add(params, "offset")
      .min(0)
      .max(1000)
      .step(0.01)
      .onChange((value) => {
        gallery.makuGroup.makus.forEach((maku) => {
          maku.mesh.material.uniforms.uOffset.value = value;
        });
      });
    gui
      .add(params, "waveIntensity")
      .min(0)
      .max(1)
      .step(0.01)
      .onChange((value) => {
        gallery.makuGroup.makus.forEach((maku) => {
          maku.mesh.material.uniforms.uWaveIntensity.value = value;
        });
      });
  }
}
