import * as kokomi from "kokomi.js";
import * as THREE from "three";
import gsap from "gsap";
import * as dat from "lil-gui";

const range = function* (start, end, step = 1) {
  let i = start;
  while (i < end) {
    yield i;
    i += step;
  }
};

class Sketch extends kokomi.Base {
  create() {
    this.camera.position.set(0, 0, 7);

    new kokomi.OrbitControls(this);

    // main object
    const fbo = new kokomi.FBO(this);
    const fboBack = new kokomi.FBO(this);

    const cm = new kokomi.CustomMesh(this, {
      baseMaterial: new THREE.ShaderMaterial(),
      geometry: new THREE.TorusGeometry(3, 1, 32, 100),
      vertexShader,
      fragmentShader,
      materialParams: {
        defines: {
          SAMPLES: 16,
        },
      },
      uniforms: {
        uTexture: {
          value: null,
        },
        uFBOResolution: {
          value: new THREE.Vector2(fbo.rt.width, fbo.rt.height),
        },
      },
    });
    cm.addExisting();

    this.update(() => {
      cm.mesh.visible = false;

      // back
      this.renderer.setRenderTarget(fboBack.rt);
      this.renderer.render(this.scene, this.camera);

      cm.mesh.material.uniforms.uTexture.value = fboBack.rt.texture;
      cm.mesh.material.side = THREE.BackSide;

      cm.mesh.visible = true;

      // front
      this.renderer.setRenderTarget(fbo.rt);
      this.renderer.render(this.scene, this.camera);

      cm.mesh.material.uniforms.uTexture.value = fbo.rt.texture;
      cm.mesh.material.side = THREE.FrontSide;

      this.renderer.setRenderTarget(null);

      cm.mesh.visible = true;
    });

    // bg
    const columns = [...range(-7.5, 10, 2.5)];
    const rows = [...range(-7.5, 10, 2.5)];

    const bgG = new THREE.Group();
    this.scene.add(bgG);
    const bgMeshes = columns.map((col, i) => {
      return rows.map((row, j) => {
        const mesh = new THREE.Mesh(
          new THREE.IcosahedronGeometry(0.5, 8),
          new THREE.MeshBasicMaterial({
            color: "white",
          })
        );
        mesh.position.set(col, row, -4);
        this.scene.add(mesh);
        bgG.add(mesh);
        return mesh;
      });
    });
    bgG.visible = false;
  }
}
