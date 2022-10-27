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
      // swiper
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

    const pf = new ParticlesFly(base, {
      color: config.bgPointColor,
      count: config.bgPointCount,
      size: config.bgPointSize,
    });
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
    });
    sqPf.mesh.material.transparent = true;
    sqPf.mesh.material.blending = THREE.AdditiveBlending;
    sqPf.mesh.position.z -= 1;
    this.sqPf = sqPf;
  }
  addExisting() {
    this.sqPf.addExisting();
  }
}

class Sketch extends kokomi.Base {
  async create() {
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

    // config
    const cgConfig = {
      color: "#f0555a",
    };

    const pqConfig = {
      bgPointColor: "#eff6fc",
      bgPointCount: 54,
      bgPointSize: 75,
    };

    // scroller
    const scroller = new kokomi.NormalScroller();
    scroller.scroll.ease = 0.025;
    scroller.listenForScroll();

    // gallery
    document.querySelectorAll("img").forEach((el) => {
      el.classList.add("opacity-0");
    });

    const cg = new CharacterGallery(this, {
      ...cgConfig,
      scroller,
    });
    await cg.addExisting();
    cg.connectSwiper(swiper);

    // particles
    const pq = new ParticleQuad(this, pqConfig);
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

    await cg.gallary.checkImagesLoaded();

    // start
    await start();
  }
}
