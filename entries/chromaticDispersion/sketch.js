import * as kokomi from "kokomi.js";
import * as THREE from "three";
import gsap from "gsap";
import * as dat from "lil-gui";

class Sketch extends kokomi.Base {
  create() {
    this.camera.position.set(0, 0, 7);

    new kokomi.OrbitControls(this);

    // main object
    const mesh = new THREE.Mesh();
    const geo = new THREE.TorusGeometry(3, 1, 32, 100);
    const mat = new kokomi.MeshTransmissionMaterial(this, mesh);
    mesh.geometry = geo;
    mesh.material = mat.material;
    this.scene.add(mesh);

    // bg
    const columns = [...kokomi.range(-7.5, 10, 2.5)];
    const rows = [...kokomi.range(-7.5, 10, 2.5)];

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
