import * as kokomi from "kokomi.js";
import * as THREE from "three";
import gsap from "gsap";
import * as dat from "lil-gui";

class CharacterGallery extends kokomi.Component {
  constructor(base, config) {
    super(base);

    const { scroller } = config;

    const gallary = new kokomi.Gallery(base, {
      vertexShader,
      fragmentShader,
      materialParams: {
        transparent: true,
      },
      scroller,
      elList: [...document.querySelectorAll("img:not(.webgl-fixed)")],
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
    this.gallary = gallary;

    this.currentFullscreenMesh = null;
  }
  async addExisting() {
    await this.gallary.addExisting();

    this.gallary.makuGroup.makus.forEach((maku) => {
      maku.el.addEventListener("click", () => {
        if (!maku.el.classList.contains("webgl-img-fullscreen")) {
          return;
        }
        if (!this.currentFullscreenMesh) {
          const progress = maku.mesh.material.uniforms.uProgress.value;
          if (progress < 0.5) {
            this.doTransition(maku.mesh);
            this.currentFullscreenMesh = maku.mesh;
          }
        }
      });
    });

    window.addEventListener("click", () => {
      if (this.currentFullscreenMesh) {
        const progress =
          this.currentFullscreenMesh.material.uniforms.uProgress.value;
        if (progress > 0.01) {
          this.undoTransition(this.currentFullscreenMesh);
          this.currentFullscreenMesh = null;
        }
      }
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

      // mesh info
      this.gallary.makuGroup.makus.forEach((maku) => {
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
  }
  doTransition(mesh) {
    document.body.classList.add("overflow-hidden");
    gsap.set(".avatars", {
      pointerEvents: "none",
    });
    gsap.to(".avatars", {
      opacity: 0,
    });
    gsap.set(".close-icon", {
      pointerEvents: "auto",
    });
    gsap.to(".close-icon", {
      opacity: 1,
      delay: 0.3,
    });
    gsap.to(mesh.material.uniforms.uProgress, {
      value: 1,
      duration: 1,
      ease: "power2.out",
    });
  }
  undoTransition(mesh) {
    document.body.classList.remove("overflow-hidden");
    gsap.to(mesh.material.uniforms.uProgress, {
      value: 0,
      duration: 1,
      ease: "power2.inOut",
    });
    gsap.set(".avatars", {
      pointerEvents: "auto",
    });
    gsap.to(".avatars", {
      opacity: 1,
    });
    gsap.set(".close-icon", {
      pointerEvents: "none",
    });
    gsap.to(".close-icon", {
      opacity: 0,
    });
  }
}

class ParticlesFly extends kokomi.Component {
  constructor(base, config) {
    super(base);

    const { color = "#eff7ff", count = 36, size = 75 } = config;

    const geometry = new THREE.BufferGeometry();

    const posBuffer = kokomi.makeBuffer(count, () =>
      THREE.MathUtils.randFloatSpread(3)
    );
    kokomi.iterateBuffer(posBuffer, posBuffer.length, (arr, axis) => {
      arr[axis.x] = THREE.MathUtils.randFloatSpread(3);
      arr[axis.y] = THREE.MathUtils.randFloatSpread(3);
      arr[axis.z] = 0;
    });

    geometry.setAttribute("position", new THREE.BufferAttribute(posBuffer, 3));

    const cm = new kokomi.CustomPoints(base, {
      baseMaterial: new THREE.ShaderMaterial(),
      // geometry: new THREE.PlaneGeometry(1, 1, 16, 16),
      geometry,
      vertexShader: vertexShader2,
      fragmentShader: fragmentShader2,
      materialParams: {
        side: THREE.DoubleSide,
        transparent: true,
        depthWrite: false,
      },
      uniforms: {
        uDevicePixelRatio: {
          value: window.devicePixelRatio,
        },
        uPointSize: {
          value: size,
        },
        uColor: {
          value: new THREE.Color(color),
        },
      },
    });
    this.cm = cm;
  }
  addExisting() {
    this.cm.container = this.container;
    this.cm.addExisting();
  }
}

class ParticleQuad extends kokomi.Component {
  constructor(base, config) {
    super(base);

    const rtScene = new THREE.Scene();
    const rtCamera = new THREE.PerspectiveCamera(
      70,
      window.innerWidth / window.innerHeight,
      0.01,
      100
    );
    rtCamera.position.z = 1;
    const rt = new kokomi.RenderTexture(base, {
      rtScene,
      rtCamera,
    });

    const pf = new ParticlesFly(base, config);
    pf.container = rtScene;
    pf.addExisting();

    const sqPf = new kokomi.RenderQuad(base, rt.texture, {
      materialParams: {
        blending: THREE.AdditiveBlending,
      },
    });
    sqPf.mesh.position.z -= 1;
    this.sqPf = sqPf;
  }
  addExisting() {
    this.sqPf.addExisting();
  }
}

class CheckerboardText extends kokomi.Component {
  constructor(base, config) {
    super(base);

    const { scroller, shadowColor } = config;

    const mg = new kokomi.MojiGroup(base, {
      vertexShader: vertexShader4,
      fragmentShader: fragmentShader4,
      scroller,
      uniforms: {
        uProgress: {
          value: 0,
        },
        uProgress1: {
          value: 0,
        },
        uGrid: {
          value: new THREE.Vector2(3, 6),
        },
        uGridSize: {
          value: 1,
        },
        uShadowColor: {
          value: new THREE.Color(shadowColor),
        },
      },
    });
    this.mg = mg;
  }
  addExisting() {
    this.mg.addExisting();

    this.mg.mojis.forEach((moji) => {
      moji.textMesh.mesh.material.uniforms.uGridSize.value =
        moji.textMesh.mesh._private_text.length;

      moji.textMesh.mesh.letterSpacing = 0.05;
    });
  }
  fadeIn(textClass, config = {}) {
    const { duration = 1.6, stagger = 0.05, delay = 0 } = config;

    if (this.mg.mojis) {
      this.mg.mojis.forEach((moji) => {
        if (!moji.el.classList.contains(textClass)) {
          return;
        }
        const totalDuration = duration;
        const t1 = gsap.timeline();
        const uniforms = moji.textMesh.mesh.material.uniforms;
        t1.to(uniforms.uProgress, {
          value: 1,
          duration: totalDuration,
          delay,
        });
        t1.to(
          uniforms.uProgress1,
          {
            value: 1,
            duration: totalDuration,
            delay,
          },
          stagger
        );
      });
    }
  }
  fadeOut(textClass, config = {}) {
    const { duration = 0.8, stagger = 0.05, delay = 0 } = config;

    if (this.mg.mojis) {
      this.mg.mojis.forEach((moji) => {
        if (!moji.el.classList.contains(textClass)) {
          return;
        }
        const totalDuration = duration;
        const t1 = gsap.timeline();
        const uniforms = moji.textMesh.mesh.material.uniforms;
        t1.to(uniforms.uProgress1, {
          value: 0,
          duration: totalDuration,
          delay,
        });
        t1.to(
          uniforms.uProgress,
          {
            value: 0,
            duration: totalDuration,
            delay,
          },
          stagger
        );
      });
    }
  }
}

class SwellFilter extends kokomi.Component {
  constructor(base) {
    super(base);

    const ce = new kokomi.CustomEffect(base, {
      vertexShader: vertexShader5,
      fragmentShader: fragmentShader5,
      uniforms: {
        uProgress: {
          value: 0,
        },
        uMaskRadius: {
          value: 100,
        },
        uDevicePixelRatio: {
          value: window.devicePixelRatio,
        },
        uMouse: {
          value: new THREE.Vector2(0, 0),
        },
        uMouseSpeed: {
          value: 0,
        },
      },
    });
    this.ce = ce;
    this.progress = 0;

    this.offsetX = 0;
    this.offsetY = 0;

    this.targetSpeed = 0;
  }
  addExisting() {
    this.ce.addExisting();
  }
  update() {
    const pr = this.progress;
    this.ce.customPass.material.uniforms.uProgress.value = pr;

    this.RGBShift();
  }
  scroll(delta) {
    const scrollSpeed = Math.abs(delta / 50);
    this.progress = THREE.MathUtils.lerp(this.progress, scrollSpeed, 0.1);
  }
  RGBShift() {
    const { x, y } = this.base.interactionManager.mouse;
    this.offsetX = THREE.MathUtils.lerp(this.offsetX, x, 0.1);
    this.offsetY = THREE.MathUtils.lerp(this.offsetY, y, 0.1);
    this.ce.customPass.material.uniforms.uMouse.value = new THREE.Vector2(
      this.offsetX,
      this.offsetY
    );

    // mouse speed
    const hoverDelta = new THREE.Vector2(
      this.base.iMouse.mouseDOMDelta.x / window.innerWidth,
      this.base.iMouse.mouseDOMDelta.y / window.innerHeight
    );

    const mouseSpeed = Math.hypot(hoverDelta.x, hoverDelta.y);
    this.targetSpeed = THREE.MathUtils.lerp(this.targetSpeed, mouseSpeed, 0.1);
    this.ce.customPass.material.uniforms.uMouseSpeed.value = Math.min(
      this.targetSpeed,
      0.05
    );
    this.targetSpeed *= 0.999;
  }
}

class Sketch extends kokomi.Base {
  async create() {
    // config
    const config = {
      scroller: {
        ease: 0.025,
      },
      cg: {
        color: "#f0555a",
      },
      pq: {
        color: "#eff6fc",
        count: 80,
        size: 60,
      },
      ct: {
        shadowColor: "#e7096a",
      },
      sf: {
        strength: 1,
      },
    };

    // functions
    const start = async () => {
      document.querySelector(".loader-screen").classList.add("hollow");

      await kokomi.sleep(500);

      gsap.to(".gallery,#sketch", {
        opacity: 1,
      });
    };

    // main
    await kokomi.preloadImages();

    // --swiper--
    const swiper = new Swiper(".swiper", {
      direction: "vertical",
      mousewheel: true,
      freeMode: {
        sticky: true,
      },
    });
    window.swiper = swiper;

    // await start();
    // return;

    // --webgl--
    const screenCamera = new kokomi.ScreenCamera(this);
    screenCamera.addExisting();

    // scroller
    const scroller = new kokomi.NormalScroller();
    scroller.scroll.ease = config.scroller.ease;
    scroller.listenForScroll();

    // gallery
    document.querySelectorAll("img:not(.webgl-fixed)").forEach((el) => {
      el.classList.add("opacity-0");
    });

    const cg = new CharacterGallery(this, {
      ...config.cg,
      scroller,
    });
    await cg.addExisting();
    cg.connectSwiper(swiper);

    // particles
    const pq = new ParticleQuad(this, config.pq);
    pq.addExisting();

    // text anime delay
    const barSlideInTexts = document.querySelectorAll(".bar-slide-in");
    barSlideInTexts.forEach((el) => {
      el.style.setProperty("--bar-slide-in-delay", "0.8s");
    });

    // checkerboard text
    document.querySelectorAll(".webgl-text").forEach((el) => {
      el.classList.add("hollow");
    });

    const ct = new CheckerboardText(this, {
      scroller,
      ...config.ct,
    });
    ct.addExisting();

    // swell filter
    const sf = new SwellFilter(this);
    sf.addExisting();

    this.update(() => {
      sf.scroll(scroller.scroll.delta);
    });

    // load images
    await cg.gallary.checkImagesLoaded();

    // start
    await start();

    // swiper
    let activeIndex = swiper.activeIndex;

    ct.fadeIn(`checkerboard-text-${activeIndex + 1}`);

    swiper.on("slideChange", (e) => {
      ct.fadeOut(`webgl-text`);

      activeIndex = swiper.activeIndex;

      ct.fadeIn(`checkerboard-text-${activeIndex + 1}`, {
        delay: 0.2,
      });
    });
  }
}
