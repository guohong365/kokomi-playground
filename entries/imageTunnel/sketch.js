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
  }
  addExisting() {
    const meshs = this.urls.map((url) => {
      const matClone = this.mat.clone();
      const mesh = new THREE.Mesh(this.geo, matClone);
      mesh.material.uniforms.uTexture.value = new THREE.TextureLoader().load(
        url
      );
      this.base.scene.add(mesh);
      return mesh;
    });
    this.meshs = meshs;

    this.randomizePos();
  }
  update() {
    if (this.uj && this.mat && this.meshs) {
      this.meshs.forEach((mesh) => {
        this.uj.injectShadertoyUniforms(mesh.material.uniforms);

        mesh.position.z = (mesh.position.z - 2) % 2000;
      });
    }
  }
  randomizePos() {
    if (this.meshs) {
      this.meshs.forEach((mesh) => {
        const theta = THREE.MathUtils.randFloat(0, 360);
        const r = THREE.MathUtils.randFloat(10, 50);
        const x = r * Math.cos(theta);
        const y = r * Math.sin(theta);
        const z = THREE.MathUtils.randFloat(-1000, 1000);
        mesh.position.x = x;
        mesh.position.y = y;
        mesh.position.z = z;
      });
    }
  }
}

class Sketch extends kokomi.Base {
  create() {
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
      return `https://picsum.photos/id/${i}/200/300`;
      // return `https://s2.loli.net/2022/09/08/gGY4VloDAeUwWxt.jpg`;
    });

    const at = new ImageTunnel(this, {
      urls,
    });
    at.addExisting();
  }
}
