import * as kokomi from "kokomi.js";
import * as THREE from "three";
import gsap from "gsap";
import * as dat from "lil-gui";

class Sketch extends kokomi.Base {
  async create() {
    const screenCamera = new kokomi.ScreenCamera(this, {
      position: new THREE.Vector3(0, 0, 500),
    });
    screenCamera.addExisting();

    const gallary = new kokomi.Gallery(this, {
      vertexShader,
      fragmentShader,
      uniforms: {
        uDevicePixelRatio: {
          value: window.devicePixelRatio,
        },
        uDistortion: {
          value: 0,
        },
        uScale: {
          value: 0,
        },
        uDisplacementX: {
          value: 0,
        },
        uDisplacementY: {
          value: 0,
        },
      },
    });
    await gallary.addExisting();

    gallary.scroller.scroll.ease = 0.06;

    // swiper
    const swiper = new Swiper(".swiper", {
      direction: "vertical",
      mousewheel: true,
    });

    this.update(() => {
      gallary.scroller.scroll.target = -swiper.translate;
    });

    // center
    const gap = 0;

    this.update(() => {
      if (gallary.makuGroup) {
        const dists = Array(gallary.makuGroup.makus.length).fill(0);

        gallary.makuGroup.makus.forEach((maku, i) => {
          maku.mesh.position.y = maku.mesh.position.y * 1.3;

          const sc = gallary.scroller.scroll.current;
          const h = maku.el.clientHeight;

          const d1 = Math.min(Math.abs(sc - i * (h + gap)) / h, 1);
          dists[i] = d1;

          // z
          maku.mesh.position.z = THREE.MathUtils.mapLinear(
            d1,
            0,
            1,
            -0.01,
            -100
          );

          // distort
          maku.mesh.material.uniforms.uDistortion.value =
            THREE.MathUtils.mapLinear(d1, 0, 1, 0, 5);

          // scale uv
          maku.mesh.material.uniforms.uScale.value = THREE.MathUtils.mapLinear(
            d1,
            0,
            1,
            0,
            0.5
          );

          // displacement Y
          const sd = gallary.scroller.scroll.delta;
          maku.mesh.material.uniforms.uDisplacementY.value = sd / 100;
        });
      }
    });
  }
}
