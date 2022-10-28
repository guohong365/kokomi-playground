import * as kokomi from "kokomi.js";
import * as THREE from "three";
import gsap from "gsap";
import * as dat from "lil";

class CharacterGallery extends kokomi.Component {
  constructor(base, config) {
    super(base);

    const { scroller } = config;

    const gallary = new kokomi.Gallery(base, {
      vertexShader,
      fragmentShader,
      makuConfig: {
        meshSizeType: "scale",
      },
      materialParams: {
        transparent: true,
      },
      scroller,
      elList: [...document.querySelectorAll("img:not(.webgl-fixed)")],
    });
    this.gallary = gallary;
  }
  async addExisting() {
    await this.gallary.addExisting();
  }
  connectSwiper(swiper) {
    this.swiper = swiper;
  }
  update() {
    if (this.gallary.makuGroup) {
      if (this.swiper) {
        this.gallary.scroller.scroll.target = -this.swiper.translate;
      }
    }
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
    rtScene.add(pf.cm.points);

    const sqPf = new kokomi.CustomMesh(base, {
      geometry: new THREE.PlaneGeometry(window.innerWidth, window.innerHeight),
      vertexShader: vertexShader3,
      fragmentShader: fragmentShader3,
      uniforms: {
        uTexture: {
          value: rt.texture,
        },
      },
      materialParams: {
        transparent: true,
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
        t1.to(
          uniforms.uProgress1,
          {
            value: 0,
            duration: totalDuration,
            delay,
          },
          stagger
        );
        t1.to(uniforms.uProgress, {
          value: 0,
          duration: totalDuration,
          delay,
        });
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
      },
    });
    this.ce = ce;
    this.progress = 0;
  }
  addExisting() {
    this.ce.addExisting();
  }
  update() {
    const pr = this.progress;
    const pr2 = THREE.MathUtils.mapLinear(pr, 0, 1, -1, 1);
    const pr3 = 1 - Math.abs(pr2);
    this.ce.customPass.material.uniforms.uProgress.value = pr;
  }
  anime(strength = 1) {
    const t1 = gsap.timeline();
    t1.set(this, {
      progress: strength,
    }).to(this, {
      progress: 0,
      duration: 1.25,
      ease: "power1.inOut",
    });
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
        count: 54,
        size: 75,
      },
      ct: {
        shadowColor: "white",
      },
      sf: {
        strength: 1,
      },
    };

    // functions
    const start = async () => {
      document.querySelector(".loader-screen").classList.add("hollow");

      await kokomi.sleep(500);

      document.querySelector("body").style.overflow = "visible";
      document.querySelector("body").style.overflowX = "hidden";

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

    // swell filter transition
    this.update(() => {
      const scrollSpeed = Math.abs(scroller.scroll.delta / 50);
      sf.progress = THREE.MathUtils.lerp(sf.progress, scrollSpeed, 0.1);
    });

    // load images
    await cg.gallary.checkImagesLoaded();

    // start
    await start();

    // swiper
    let activeIndex = swiper.activeIndex;

    ct.fadeIn(`intro-text-${activeIndex + 1}`);

    swiper.on("slideChange", (e) => {
      // swell filter
      // isTransitionEnabled = true;

      // checkerboard text
      ct.fadeOut(`webgl-text`);

      activeIndex = swiper.activeIndex;

      ct.fadeIn(`intro-text-${activeIndex + 1}`, {
        delay: 0.2,
      });
    });
  }
}
