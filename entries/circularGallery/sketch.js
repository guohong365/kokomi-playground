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
        uFloat: {
          value: 1,
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

    // circular
    this.update(() => {
      gallary.makuGroup.makus.forEach((maku, i) => {
        const imgWidth = gallary.makuGroup.makus[0].el.clientWidth;

        const totalWidth = (imgWidth + gap) * gallary.makuGroup.makus.length;

        const progressX = maku.mesh.position.x / totalWidth;

        maku.mesh.rotation.z = THREE.MathUtils.mapLinear(
          maku.mesh.position.x,
          -totalWidth,
          totalWidth,
          Math.PI,
          -Math.PI
        );

        const r = 500;

        maku.mesh.position.y = r * (Math.cos(progressX * Math.PI) - 1);
      });
    });
  }
}
