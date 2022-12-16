import * as kokomi from "kokomi.js";
import * as THREE from "three";
import gsap from "gsap";
import * as dat from "lil";

class ImageTunnel extends kokomi.Component {
  constructor(base, config = {}) {
    super(base);

    const { urls } = config;
    this.urls = urls;

    const uj = new kokomi.UniformInjector(this.base);
    this.uj = uj;

    const mat = new THREE.ShaderMaterial({
      vertexShader,
      fragmentShader,
      uniforms: {
        ...uj.shadertoyUniforms,
        uTexture: {
          value: null,
        },
      },
      transparent: true,
      depthWrite: false,
      side: THREE.DoubleSide,
    });
    this.mat = mat;

    const geo = new THREE.PlaneGeometry(10, 10);
    this.geo = geo;

    this.meshs = [];

    this.isRunning = false;
  }
  addMesh() {
    const matClone = this.mat.clone();
    const mesh = new THREE.Mesh(this.geo, matClone);
    this.base.scene.add(mesh);
    return mesh;
  }
  addImage(url) {
    return new Promise((resolve) => {
      new THREE.TextureLoader().load(
        url,
        (res) => {
          const mesh = this.addMesh();
          this.meshs.push(mesh);
          mesh.material.uniforms.uTexture.value = res;
          resolve(mesh);
        },
        () => {},
        () => {
          resolve(true);
        }
      );
    });
  }
  async addImages(urls) {
    await Promise.all(urls.map((url) => this.addImage(url)));
  }
  async addExisting() {
    await this.addImages(this.urls);
    this.emit("ready");
    this.randomizeMeshesPos();
    this.run();
  }
  update() {
    if (this.uj && this.mat && this.meshs) {
      if (!this.isRunning) {
        return;
      }
      this.meshs.forEach((mesh) => {
        this.uj.injectShadertoyUniforms(mesh.material.uniforms);
        mesh.position.z = (mesh.position.z - 2) % 2000;
      });
    }
  }
  getRandomXY() {
    const theta = THREE.MathUtils.randFloat(0, 360);
    const r = THREE.MathUtils.randFloat(10, 50);
    const x = r * Math.cos(theta);
    const y = r * Math.sin(theta);
    return { x, y };
  }
  getRandomPos() {
    const { x, y } = this.getRandomXY();
    const z = THREE.MathUtils.randFloat(-1000, 1000);
    return new THREE.Vector3(x, y, z);
  }
  randomizeMeshesPos() {
    if (this.meshs) {
      this.meshs.forEach((mesh) => {
        const randPos = this.getRandomPos();
        mesh.position.copy(randPos);
      });
    }
  }
  run() {
    this.isRunning = true;
  }
  stop() {
    this.isRunning = false;
  }
  async addImageAtRandPos(url) {
    const newMesh = await this.addImage(url);
    const { x, y } = this.getRandomXY();
    const newMeshPos = new THREE.Vector3(x, y, -900);
    newMesh.position.copy(newMeshPos);
  }
}

class Sketch extends kokomi.Base {
  async create() {
    const camera = new THREE.PerspectiveCamera(
      60,
      window.innerWidth / window.innerHeight,
      0.1,
      10000
    );
    this.camera = camera;
    this.interactionManager.camera = camera;
    camera.position.z = -1000;

    // new kokomi.OrbitControls(this);

    const urls = [...Array(100).keys()].map((item, i) => {
      return `https://picsum.photos/id/${i}/100/100`;
      // return `https://s2.loli.net/2022/09/08/gGY4VloDAeUwWxt.jpg`;
    });

    const at = new ImageTunnel(this, {
      urls,
    });
    at.on("ready", () => {
      document.querySelector(".loader-screen").classList.add("hollow");
    });
    await at.addExisting();

    // test single mesh
    // at.emit("ready");
    // const mesh = at.addMesh();
    // mesh.position.z = -1025;

    // test add image at rand pos
    // await kokomi.sleep(1000);

    // await at.addImageAtRandPos(
    //   "https://s2.loli.net/2022/09/08/gGY4VloDAeUwWxt.jpg"
    // );
  }
}
