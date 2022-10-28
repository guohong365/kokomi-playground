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
  }
  addExisting() {
    this.ce.addExisting();
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
      sf: {
        strength: 0.15,
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

    // text mesh group
    document.querySelectorAll(".webgl-text").forEach((el) => {
      el.classList.add("hollow");
    });

    const mg = new kokomi.MojiGroup(this, {
      vertexShader: vertexShader4,
      fragmentShader: fragmentShader4,
      scroller,
    });
    mg.addExisting();

    // swell filter
    const params = {
      progress: 0,
    };

    const sf = new SwellFilter(this);
    sf.addExisting();

    this.update(() => {
      const pr = params.progress;
      const pr2 = THREE.MathUtils.mapLinear(pr, 0, 1, -1, 1);
      const pr3 = 1 - Math.abs(pr2);
      sf.ce.customPass.material.uniforms.uProgress.value = pr3;
    });

    // swell filter transition
    let isTransitionEnabled = false;

    const sfAnime = () => {
      const t1 = gsap.timeline();
      t1.set(params, {
        progress: config.sf.strength,
      }).to(params, {
        progress: 0,
        duration: 1.25,
        ease: "power1.inOut",
      });
    };

    this.update(() => {
      if (isTransitionEnabled) {
        sfAnime();
        isTransitionEnabled = false;
      }
    });

    swiper.on("slideChange", (e) => {
      isTransitionEnabled = true;
    });

    // load images
    await cg.gallary.checkImagesLoaded();

    // start
    await start();
  }
}
