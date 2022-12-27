import * as kokomi from "kokomi.js";
import * as THREE from "three";
import gsap from "gsap";
import * as dat from "lil";

class Sketch extends kokomi.Base {
  create() {
    const screenCamera = new kokomi.ScreenCamera(this);
    screenCamera.addExisting();

    new kokomi.OrbitControls(this);

    // scene1
    const rtScene1 = new THREE.Scene();
    const rtCamera1 = new THREE.PerspectiveCamera(
      70,
      window.innerWidth / window.innerHeight,
      0.01,
      1000
    );
    rtCamera1.position.z = 2;

    const cm = new kokomi.CustomMesh(this, {
      baseMaterial: new THREE.ShaderMaterial(),
      geometry: new THREE.PlaneGeometry(1, 1, 16, 16),
      vertexShader,
      fragmentShader,
      materialParams: {
        side: THREE.DoubleSide,
      },
    });
    rtScene1.add(cm.mesh);

    const rt = new kokomi.RenderTexture(this, {
      rtScene: rtScene1,
      rtCamera: rtCamera1,
    });

    const quad1 = new kokomi.CustomMesh(this, {
      vertexShader: "",
      fragmentShader: "",
      baseMaterial: new THREE.MeshBasicMaterial(),
      geometry: new THREE.PlaneGeometry(window.innerWidth, window.innerHeight),
      materialParams: {
        map: rt.texture,
        transparent: true,
      },
    });
    quad1.addExisting();
    quad1.mesh.position.z = -1;
  }
}
