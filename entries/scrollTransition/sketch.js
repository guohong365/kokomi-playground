import * as kokomi from "kokomi.js";
import * as THREE from "three";
import gsap from "gsap";
import * as dat from "lil-gui";

class Sketch extends kokomi.Base {
  create() {
    const frustum = 1;
    const orthoCamera = new kokomi.OrthographicCamera({
      frustum,
      useAspect: false,
    });
    this.camera = orthoCamera;
    this.camera.position.z = 3;

    // new kokomi.OrbitControls(this);

    // scene1
    const rtScene1 = new THREE.Scene();
    rtScene1.background = new THREE.Color("#47B5FF");

    const rtCamera1 = new THREE.PerspectiveCamera(
      70,
      window.innerWidth / window.innerHeight,
      0.01,
      100
    );
    rtCamera1.position.z = 2;

    const mesh1 = new THREE.Mesh(
      new THREE.TorusGeometry(0.6, 0.2, 32, 100),
      new THREE.MeshNormalMaterial()
    );
    rtScene1.add(mesh1);

    const rt1 = new kokomi.RenderTexture(this, {
      rtScene: rtScene1,
      rtCamera: rtCamera1,
    });

    // scene2
    const rtScene2 = new THREE.Scene();
    rtScene2.background = new THREE.Color("#256D85");

    const rtCamera2 = new THREE.PerspectiveCamera(
      70,
      window.innerWidth / window.innerHeight,
      0.01,
      100
    );
    rtCamera2.position.z = 2;

    const mesh2 = new THREE.Mesh(
      new THREE.SphereGeometry(0.75, 64, 64),
      new THREE.MeshNormalMaterial()
    );
    rtScene2.add(mesh2);

    const rt2 = new kokomi.RenderTexture(this, {
      rtScene: rtScene2,
      rtCamera: rtCamera2,
    });

    // scene3
    const rtScene3 = new THREE.Scene();
    rtScene3.background = new THREE.Color("#06283D");

    const rtCamera3 = new THREE.PerspectiveCamera(
      70,
      window.innerWidth / window.innerHeight,
      0.01,
      100
    );
    rtCamera3.position.z = 2;

    const mesh3 = new THREE.Mesh(
      new THREE.TorusKnotGeometry(0.5, 0.1),
      new THREE.MeshNormalMaterial()
    );
    rtScene3.add(mesh3);

    const rt3 = new kokomi.RenderTexture(this, {
      rtScene: rtScene3,
      rtCamera: rtCamera3,
    });

    // quad
    const rts = [rt1, rt2, rt3];
    const rtCount = rts.length;

    const quadGeo = new THREE.PlaneGeometry(1, 1);

    const uj = new kokomi.UniformInjector(this);
    const quadMat = new THREE.ShaderMaterial({
      vertexShader,
      fragmentShader,
      uniforms: {
        ...uj.shadertoyUniforms,
        ...{
          iChannel0: {
            value: rts[0].texture,
          },
          iChannel1: {
            value: rts[1].texture,
          },
          uProgress: {
            value: 0,
          },
        },
      },
    });
    this.quadMat = quadMat;
    this.update(() => {
      uj.injectShadertoyUniforms(quadMat.uniforms);
    });

    const quad = new THREE.Mesh(quadGeo, quadMat);
    this.scene.add(quad);

    // this.createDebug();

    // scroll
    const wheelScroller = new kokomi.WheelScroller();
    wheelScroller.listenForScroll();

    let currentId = 0;

    this.update(() => {
      wheelScroller.syncScroll();
      const sc = wheelScroller.scroll.current;
      const norSc =
        (sc + 114514 * rtCount * window.innerHeight) / window.innerHeight;
      const pr = norSc % 1;
      currentId = Math.floor(norSc);

      quadMat.uniforms.uProgress.value = pr;
      quadMat.uniforms.iChannel0.value = rts[currentId % rtCount].texture;
      quadMat.uniforms.iChannel1.value = rts[(currentId + 1) % rtCount].texture;
    });
  }
  createDebug() {
    const params = {
      progress: 0,
    };
    const quadMat = this.quadMat;

    const gui = new dat.GUI();
    gui
      .add(params, "progress")
      .min(0)
      .max(1)
      .step(0.01)
      .onChange((val) => {
        quadMat.uniforms.uProgress.value = val;
      });
  }
}
