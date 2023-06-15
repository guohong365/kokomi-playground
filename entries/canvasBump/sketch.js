import * as kokomi from "kokomi.js";
import * as THREE from "three";
import gsap from "gsap";
import * as dat from "lil-gui";

class Sketch extends kokomi.Base {
  create() {
    // reference: https://charlottedann.com/article/ceramics-2d-to-3d
    const getDepthGeometryFromCanvas = (c, config = {}) => {
      const { width = 1000, height = 1000, maxDepth = 100 } = config;
      const columns = width + 1;
      const rows = height + 1;

      // construct plane and set the z-axis of each vertex to the pixel's depth
      const plane = new THREE.PlaneGeometry(width, height, width, height);
      const depthData = c.getImageData(0, 0, columns, rows).data;
      const positionAttribute = plane.getAttribute("position");
      for (let i = 0, count = positionAttribute.count; i < count; i++) {
        // the depthData is an array of RGBA values
        // we're taking the red channel which has the values 0-255
        positionAttribute.setZ(i, (depthData[i * 4] / 255) * maxDepth);
      }

      // compute the normals of each vertex based on the triangles they're
      // connected to, this makes the lighting reflect accurately
      positionAttribute.needsUpdate = true;
      plane.computeVertexNormals();
      return plane;
    };

    const width = 1000;
    const height = 1000;
    const maxDepth = 100;

    const camera = new kokomi.OrthographicCamera({
      frustum: width,
      useAspect: false,
    });
    camera.position.set(0, 0, 500);
    this.camera = camera;
    this.interactionManager.camera = camera;

    // we need the depth data for one unit wider than the output image
    const columns = width + 1;
    const rows = height + 1;

    const canvas = document.createElement("canvas");
    canvas.width = columns;
    canvas.height = rows;
    const c = canvas.getContext("2d");

    // draw whatever you'd like on the canvas
    c.fillStyle = "black";
    c.fillRect(0, 0, columns, rows);
    c.filter = "blur(100px)";
    c.fillStyle = "white";
    c.beginPath();
    c.arc(width / 2, width / 2, width / 2, 0, Math.PI * 2);
    c.fill();

    // mesh
    const dirLight = new THREE.DirectionalLight(0xffffff, 1);
    dirLight.position.set(5, 5, 5);
    this.scene.add(dirLight);

    const geometry = getDepthGeometryFromCanvas(c, {
      width,
      height,
      maxDepth,
    });
    const material = new THREE.MeshStandardMaterial();
    const mesh = new THREE.Mesh(geometry, material);
    this.scene.add(mesh);
  }
}
