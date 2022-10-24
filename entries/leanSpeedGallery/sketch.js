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
      isScrollPositionSync: false,
      uniforms: {
        uVelocity: {
          value: 0,
        },
      },
      makuConfig: {
        meshSizeType: "scale",
        segments: {
          width: 32,
          height: 32,
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

    // lean speed
    this.update(() => {
      gallary.makuGroup.makus.forEach((maku, i) => {
        const delta = wheelScroller.scroll.delta;

        maku.mesh.material.uniforms.uVelocity.value = delta * 0.025;
      });
    });
  }
}
