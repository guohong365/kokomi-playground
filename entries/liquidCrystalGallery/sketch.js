import * as kokomi from "kokomi.js";
import * as THREE from "three";
import gsap from "gsap";
import * as dat from "lil-gui";

class LiquidCrystal extends kokomi.Component {
  constructor(base, config) {
    super(base);

    const { scroller } = config;

    this.scroller = scroller;

    const resourceList = [
      {
        name: "cubemap",
        type: "cubeTexture",
        path: [
          "https://s2.loli.net/2022/11/02/AdySfoqhV8W5Fgr.png",
          "https://s2.loli.net/2022/11/02/raZmYvN5kC8gVdu.png",
          "https://s2.loli.net/2022/11/02/jhUc8kHMIxBwKSR.png",
          "https://s2.loli.net/2022/11/02/Dk6grUanARNLpOM.png",
          "https://s2.loli.net/2022/11/02/CwBdbtuMoQmKcjq.png",
          "https://s2.loli.net/2022/11/02/SrZMC3bDAd7xJwj.png",
        ],
      },
    ];
    this.resourceList = resourceList;

    const params = {
      size: 0.28,
      glow: 0.005,
      mouse1Lerp: 0.1,
      mouse2Lerp: 0.09,
    };
    this.params = params;

    this.offsetX1 = 0;
    this.offsetY1 = 0;

    this.offsetX2 = 0;
    this.offsetY2 = 0;

    this.isMouseFollow = true;
    this.moveTargetX = 0;
    this.moveTargetY = 0;
  }
  async addExisting() {
    const { base, params, resourceList } = this;

    return new Promise((resolve) => {
      const am = new kokomi.AssetManager(base, resourceList);
      am.on("ready", () => {
        const sq = new kokomi.ScreenQuad(base, {
          shadertoyMode: true,
          fragmentShader,
          uniforms: {
            uMouse1: {
              value: new THREE.Vector2(0, 0),
            },
            uMouse2: {
              value: new THREE.Vector2(0, 0),
            },
            uSize: {
              value: params.size,
            },
            uAspect: {
              value: new THREE.Vector2(1, 1),
            },
            uCubemap: {
              value: null,
            },
            uRt: {
              value: null,
            },
            uRt2: {
              value: null,
            },
            uRt2Opacity: {
              value: 0,
            },
          },
        });
        sq.container = this.container;
        sq.material.transparent = true;
        sq.material.defines = {
          GLOW: params.glow,
        };
        sq.addExisting();

        sq.material.uniforms.uCubemap.value = am.items["cubemap"];

        sq.mesh.position.z = 1;

        this.sq = sq;

        resolve(sq);
      });
    });
  }
  moveTo(x, y) {
    const { params, sq } = this;

    const mouse = new THREE.Vector2(
      x / window.innerWidth,
      y / window.innerHeight
    );

    const mouse1Lerp = params.mouse1Lerp;
    const mouse2Lerp = params.mouse2Lerp;

    this.offsetX1 = THREE.MathUtils.lerp(this.offsetX1, mouse.x, mouse1Lerp);
    this.offsetY1 = THREE.MathUtils.lerp(this.offsetY1, mouse.y, mouse1Lerp);

    this.offsetX2 = THREE.MathUtils.lerp(
      this.offsetX2,
      this.offsetX1,
      mouse2Lerp
    );
    this.offsetY2 = THREE.MathUtils.lerp(
      this.offsetY2,
      this.offsetY1,
      mouse2Lerp
    );

    sq.material.uniforms.uMouse1.value = new THREE.Vector2(
      this.offsetX1,
      this.offsetY1
    );
    sq.material.uniforms.uMouse2.value = new THREE.Vector2(
      this.offsetX2,
      this.offsetY2
    );
  }
  update() {
    const { sq } = this;

    if (sq) {
      // mouse
      if (this.isMouseFollow) {
        this.moveTargetX = this.base.iMouse.mouseScreen.x;
        this.moveTargetY = this.base.iMouse.mouseScreen.y;
      }

      // move
      this.moveTo(this.moveTargetX, this.moveTargetY);

      // aspect
      if (window.innerHeight / window.innerWidth > 1) {
        sq.material.uniforms.uAspect.value = new THREE.Vector2(
          window.innerWidth / window.innerHeight,
          1
        );
      } else {
        sq.material.uniforms.uAspect.value = new THREE.Vector2(
          1,
          window.innerHeight / window.innerWidth
        );
      }

      // rt
      if (this.rt) {
        sq.material.uniforms.uRt.value = this.rt.texture;
      }

      // rt2
      if (this.rt2) {
        sq.material.uniforms.uRt2.value = this.rt2.texture;
      }
    }
  }
  setRt(rt) {
    this.rt = rt;
  }
  setRt2(rt2) {
    this.rt2 = rt2;
  }
  fadeInRt2() {
    const { sq } = this;

    if (this.rt2) {
      gsap.to(sq.material.uniforms.uRt2Opacity, {
        value: 1,
      });
    }
  }
  fadeOutRt2() {
    const { sq } = this;

    if (this.rt2) {
      gsap.to(sq.material.uniforms.uRt2Opacity, {
        value: 0,
      });
    }
  }
  followMouse() {
    this.isMouseFollow = true;
  }
  unfollowMouse() {
    this.isMouseFollow = false;
  }
  snapToPoint(el) {
    const rect = el.getBoundingClientRect();
    const { x, y, width, height } = rect;
    const posScreen = this.base.iMouse.getMouseScreen(
      x + width / 2,
      y + height / 2
    );
    const px = posScreen.x;
    const py = posScreen.y;
    gsap.to(this, {
      moveTargetX: px,
    });
    gsap.to(this, {
      moveTargetY: py,
    });
  }
}

class WebGLText extends kokomi.Component {
  constructor(base, config) {
    super(base);

    const { scroller } = config;

    const mg = new kokomi.MojiGroup(base, {
      vertexShader: vertexShader2,
      fragmentShader: fragmentShader2,
      scroller,
      elList: [...document.querySelectorAll(".webgl-text")],
    });
    this.mg = mg;
  }
  addExisting() {
    this.mg.container = this.container;
    this.mg.addExisting();

    this.mg.mojis.forEach((moji) => {
      moji.textMesh.mesh.letterSpacing = 0.05;
    });
  }
}

class WebGLGallery extends kokomi.Component {
  constructor(base, config) {
    super(base);

    const { scroller } = config;

    const gallary = new kokomi.Gallery(base, {
      vertexShader: vertexShader3,
      fragmentShader: fragmentShader3,
      materialParams: {
        transparent: true,
      },
      scroller,
      elList: [...document.querySelectorAll(".webgl-img")],
      isScrollPositionSync: false,
      uniforms: {
        uOpacity: {
          value: 1,
        },
      },
    });
    this.gallary = gallary;

    this.targetX = 0;
    this.targetY = 0;
  }
  async addExisting() {
    this.gallary.container = this.container;
    await this.gallary.addExisting();
  }
  hideAll() {
    this.gallary.makuGroup.makus.forEach((maku) => {
      maku.mesh.visible = false;
    });
  }
  connectSwiper(swiper) {
    this.swiper = swiper;
  }
  update() {
    if (this.gallary.makuGroup) {
      // swiper
      if (this.swiper) {
        this.gallary.scroller.scroll.target = -this.swiper.translate;
      }

      // mouse
      this.targetX = THREE.MathUtils.lerp(
        this.targetX,
        this.base.interactionManager.mouse.x / 40,
        0.1
      );
      this.targetY = THREE.MathUtils.lerp(
        this.targetY,
        this.base.interactionManager.mouse.y / 40,
        0.1
      );

      this.gallary.makuGroup.makus.forEach((maku) => {
        // mouse follow
        if (maku.el.dataset["webglMouseFollow"] === "1") {
          this.base.update(() => {
            const offsetX = Number(maku.el.dataset["webglMouseOffsetX"]) || 0;
            const posX = this.targetX + offsetX;
            const offsetY = Number(maku.el.dataset["webglMouseOffsetY"]) || 0;
            const posY = this.targetY + offsetY;
            maku.mesh.position.x = (posX * window.innerWidth) / 2;
            maku.mesh.position.y = (posY * window.innerHeight) / 2;
          });
        }
      });
    }
  }
}

class Sketch extends kokomi.Base {
  async create() {
    const screenCamera = new kokomi.ScreenCamera(this);
    screenCamera.addExisting();

    new kokomi.OrbitControls(this);

    // functions
    const start = async () => {
      document.querySelector(".loader-screen").classList.add("hollow");

      await kokomi.sleep(500);

      gsap.to(".gallery,#sketch", {
        opacity: 1,
      });
    };

    // --swiper--
    const swiper = new Swiper(".swiper", {
      direction: "vertical",
      mousewheel: true,
    });
    window.swiper = swiper;

    // await start();
    // return;

    // --webgl--

    // scroller
    const scroller = new kokomi.NormalScroller(this);
    scroller.scroll.ease = 0.025;
    scroller.listenForScroll();

    // liquid crystal
    const lc = new LiquidCrystal(this, {
      scroller,
    });

    await lc.addExisting();

    // load font
    await kokomi.preloadSDFFont();

    // text
    document.querySelectorAll(".webgl-text").forEach((el) => {
      el.classList.add("opacity-0");
      el.classList.add("select-none");
    });
    const wt = new WebGLText(this, {
      scroller,
    });
    wt.addExisting();

    // rt for text
    const rtScene1 = new THREE.Scene();

    const wt2 = new WebGLText(this, {
      scroller,
    });
    wt2.container = rtScene1;
    wt2.addExisting();

    const rt = new kokomi.RenderTexture(this, {
      rtScene: rtScene1,
      rtCamera: this.camera,
    });

    this.update(() => {
      lc.setRt(rt);
    });

    // gallery
    document.querySelectorAll(".webgl-img").forEach((el) => {
      el.classList.add("opacity-0");
    });
    const wg = new WebGLGallery(this, {
      scroller,
    });
    wg.connectSwiper(swiper);

    // rt for img
    const rtScene2 = new THREE.Scene();

    wg.container = rtScene2;
    await wg.addExisting();

    const rt2 = new kokomi.RenderTexture(this, {
      rtScene: rtScene2,
      rtCamera: this.camera,
    });

    lc.setRt2(rt2);

    const showImgOnly = (id) => {
      wg.gallary.makuGroup.makus.forEach((maku) => {
        gsap.to(maku.mesh.material.uniforms.uOpacity, {
          value: 0,
          duration: 0.8,
        });
        if (id === Number(maku.el.dataset["webglImgId"])) {
          gsap.to(maku.mesh.material.uniforms.uOpacity, {
            value: 1,
            duration: 0.8,
          });
        }
      });
    };

    // transition
    let activeIndex = swiper.activeIndex;

    swiper.on("slideChange", (e) => {
      activeIndex = swiper.activeIndex;

      if (activeIndex === 0) {
        lc.followMouse();
        lc.fadeOutRt2();
      } else if (activeIndex === 1) {
        lc.unfollowMouse();
        lc.fadeInRt2();
        lc.snapToPoint(document.querySelector(".webgl-snap-point-1"));
        showImgOnly(1);
      } else if (activeIndex === 2) {
        lc.unfollowMouse();
        lc.fadeInRt2();
        lc.snapToPoint(document.querySelector(".webgl-snap-point-2"));
        showImgOnly(2);
      } else if (activeIndex === 3) {
        lc.followMouse();
        lc.fadeOutRt2();
      }
    });

    // load images
    await wg.gallary.checkImagesLoaded();

    await start();
  }
}
