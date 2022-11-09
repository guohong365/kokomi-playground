import * as kokomi from "kokomi.js";
import * as THREE from "three";
import gsap from "gsap";
import * as dat from "lil";

class Sketch extends kokomi.Base {
  async create() {
    this.camera.position.set(0, 0, 2);

    const params = {
      count: 6000,
      color1: "#d1a657",
      color2: "#62b1cf",
      size: 15,
      depth1: 0.025,
    };

    new kokomi.OrbitControls(this);

    const font = await kokomi.loadFont();

    const uj = new kokomi.UniformInjector(this);

    const material = new THREE.ShaderMaterial({
      vertexShader,
      fragmentShader,
      side: THREE.DoubleSide,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      uniforms: {
        ...uj.shadertoyUniforms,
        uColor1: {
          value: new THREE.Color(params.color1),
        },
        uColor2: {
          value: new THREE.Color(params.color2),
        },
        uPointSize: {
          value: params.size,
        },
        uDepth: {
          value: 0,
        },
        uTransparentRate: {
          value: 1,
        },
      },
    });

    this.update(() => {
      uj.injectShadertoyUniforms(material.uniforms);
    });

    let t3d = null;
    let im = null;
    let im2 = null;

    const createText = (str) => {
      t3d = new kokomi.Text3D(
        this,
        str,
        font,
        {
          size: 0.6,
          height: 0.2,
          curveSegments: 120,
          bevelEnabled: true,
          bevelThickness: 0.03,
          bevelSize: 0.02,
          bevelOffset: 0,
          bevelSegments: 5,
        },
        {
          baseMaterial: new THREE.ShaderMaterial(),
          vertexShader,
          fragmentShader,
          materialParams: {
            side: THREE.DoubleSide,
          },
        }
      );
      t3d.mesh.geometry.center();

      const sampledPos = kokomi.sampleParticlesPositionFromMesh(
        t3d.mesh.geometry.toNonIndexed(),
        params.count
      );

      const pIndexs = kokomi.makeBuffer(sampledPos.length / 3, (v, k) => v);

      const geometry = new THREE.BufferGeometry();
      geometry.setAttribute(
        "position",
        new THREE.BufferAttribute(sampledPos, 3)
      );
      geometry.setAttribute("pIndex", new THREE.BufferAttribute(pIndexs, 1));

      if (im) {
        this.scene.remove(im);
      }
      const mat1 = material.clone();
      mat1.uniforms.uDepth.value = 0;
      this.update(() => {
        uj.injectShadertoyUniforms(mat1.uniforms);
      });
      im = new THREE.Points(geometry, mat1);
      this.scene.add(im);

      if (im2) {
        this.scene.remove(im2);
      }
      const mat2 = material.clone();
      mat2.uniforms.uDepth.value = 1;
      mat2.uniforms.uTransparentRate.value = 0.35;
      mat2.uniforms.uPointSize.value = params.size * 2;
      this.update(() => {
        uj.injectShadertoyUniforms(mat2.uniforms);
      });
      im2 = new THREE.Points(geometry, mat2);
      this.scene.add(im2);

      return im;
    };

    const createTextByEl = (sel = ".webgl-text") => {
      let textEl = document.querySelector(sel);
      let text = textEl.innerText;
      createText(text);
    };

    createTextByEl();
    document.addEventListener("keyup", () => {
      createTextByEl();
    });
  }
}
