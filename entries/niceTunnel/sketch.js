import * as kokomi from "kokomi.js";
import * as THREE from "three";
import gsap from "gsap";
import * as dat from "lil";
import { MeshLineGeometry as MeshLine, MeshLineMaterial } from "meshline";

class ImageTunnel extends kokomi.Component {
  constructor(base, config = {}) {
    super(base);

    const {
      urls = [],
      speed = 1,
      imageSize = 5,
      container = this.base.scene,
    } = config;
    this.urls = urls;
    this.speed = speed;
    this.imageSize = imageSize;
    this.container = container;

    const mat = new THREE.MeshPhongMaterial({
      side: THREE.DoubleSide,
    });
    this.mat = mat;

    const geo = new THREE.CircleGeometry(this.imageSize, 64);
    this.geo = geo;

    this.meshs = [];

    this.isRunning = false;
  }
  addMesh(container = this.container) {
    const matClone = this.mat.clone();
    const mesh = new THREE.Mesh(this.geo, matClone);
    container.add(mesh);
    return mesh;
  }
  addImage(url) {
    return new Promise((resolve) => {
      new THREE.TextureLoader().load(
        url,
        (res) => {
          const mesh = this.addMesh();
          this.meshs.push(mesh);
          mesh.material.map = res;
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
    if (this.mat && this.meshs) {
      if (!this.isRunning) {
        return;
      }
      this.meshs.forEach((mesh) => {
        mesh.position.z = (mesh.position.z - 2 * this.speed) % 2000;
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
  async addImageAtRandXY(url) {
    const newMesh = await this.addImage(url);
    const { x, y } = this.getRandomXY();
    const newMeshPos = new THREE.Vector3(x, y, -900);
    newMesh.position.copy(newMeshPos);
  }
}

const sample = (arr) => arr[Math.floor(Math.random() * arr.length)];

// Credit: https://github.com/Jeremboo/animated-mesh-lines
class AnimatedMeshLine extends kokomi.Component {
  constructor(
    base,
    {
      width = 0.1,
      speed = 0.01,
      visibleLength = 0.5,
      color = new THREE.Color("#000000"),
      opacity = 1,
      position = new THREE.Vector3(0, 0, 0),

      // Array of points already done
      points = false,
      // Params to create the array of points
      length = 2,
      nbrOfPoints = 3,
      orientation = new THREE.Vector3(1, 0, 0),
      turbulence = new THREE.Vector3(0, 0, 0),
    } = {}
  ) {
    super(base);

    // * ******************************
    // * Create the main line
    let linePoints = [];
    if (!points) {
      const currentPoint = new THREE.Vector3();
      // The size of each segment oriented in the good directon
      const segment = orientation
        .normalize()
        .multiplyScalar(length / nbrOfPoints);
      linePoints.push(currentPoint.clone());
      for (let i = 0; i < nbrOfPoints - 1; i++) {
        // Increment the point depending to the orientation
        currentPoint.add(segment);
        // Add turbulence to the current point
        linePoints.push(
          currentPoint
            .clone()
            .set(
              currentPoint.x +
                THREE.MathUtils.randFloat(-turbulence.x, turbulence.x),
              currentPoint.y +
                THREE.MathUtils.randFloat(-turbulence.y, turbulence.y),
              currentPoint.z +
                THREE.MathUtils.randFloat(-turbulence.z, turbulence.z)
            )
        );
      }
      // Finish the curve to the correct point without turbulence
      linePoints.push(currentPoint.add(segment).clone());
      // * ******************************
      // * Smooth the line
      // TODO 3D spline curve https://math.stackexchange.com/questions/577641/how-to-calculate-interpolating-splines-in-3d-space
      // TODO https://github.com/mrdoob/three.js/blob/master/examples/webgl_geometry_nurbs.html
      const curve = new THREE.SplineCurve(linePoints);
      linePoints = new THREE.Geometry().setFromPoints(curve.getPoints(50));
    } else {
      linePoints = points;
    }

    // * ******************************
    // * Create the MeshLineGeometry
    const geometry = new MeshLine();
    geometry.setPoints(linePoints);

    // * ******************************
    // * Create the Line Material
    // dashArray - the length and space between dashes. (0 - no dash)
    // dashRatio - defines the ratio between that is visible or not (0 - more visible, 1 - more invisible).
    // dashOffset - defines the location where the dash will begin. Ideal to animate the line.
    // DashArray: The length of a dash = dashArray * length.
    // Here 2 mean a cash is 2 time longer that the original length
    const dashArray = 2;
    // Start to 0 and will be decremented to show the dashed line
    const dashOffset = 0;
    // The ratio between that is visible and other
    const dashRatio = 1 - visibleLength * 0.5; // Have to be between 0.5 and 1.

    const material = new MeshLineMaterial({
      lineWidth: width,
      dashArray,
      dashOffset,
      dashRatio, // The ratio between that is visible or not for each dash
      opacity,
      transparent: true,
      depthWrite: false,
      color,
    });

    // * ******************************
    // * Init
    const mesh = new THREE.Mesh(geometry, material);
    this.mesh = mesh;
    this.mesh.position.copy(position);

    this.speed = speed;
    this.voidLength = dashArray * dashRatio; // When the visible part is out
    this.dashLength = dashArray - this.voidLength;

    this.dyingAt = 1;
    this.diedAt = this.dyingAt + this.dashLength;
  }

  /**
   * * *******************
   * * UPDATE
   * * *******************
   */
  update() {
    if (this.mesh) {
      // Increment the dash
      this.mesh.material.uniforms.dashOffset.value -= this.speed;

      // TODO make that into a decorator
      // Reduce the opacity then the dash start to desapear
      if (this.isDying) {
        this.mesh.material.uniforms.opacity.value =
          0.9 +
          (this.mesh.material.uniforms.dashOffset.value + 1) / this.dashLength;
      }
    }
  }

  /**
   * * *******************
   * * CONDITIONS
   * * *******************
   */
  get isDied() {
    if (!this.mesh) {
      return false;
    }
    return this.mesh.material.uniforms.dashOffset.value < -this.diedAt;
  }

  get isDying() {
    if (!this.mesh) {
      return false;
    }
    return this.mesh.material.uniforms.dashOffset.value < -this.dyingAt;
  }
}

class LineGenerator extends kokomi.Component {
  constructor(base, { frequency = 0.1, container = null } = {}, lineProps) {
    super(base);

    this.group = new THREE.Group();

    this.frequency = frequency;
    this.lineStaticProps = lineProps;
    this.container = container || this.base.scene;

    this.isStarted = false;

    this.i = 0;
    this.lines = [];
    this.nbrOfLines = -1;
  }

  /**
   * * *******************
   * * ANIMATION
   * * *******************
   */
  addExisting() {
    this.container.add(this.group);
  }
  start() {
    this.isStarted = true;
  }

  stop(callback) {
    this.isStarted = false;
    // TODO callback when all lines are hidden
  }

  /**
   * * *******************
   * * LINES
   * * *******************
   */
  addLine(props) {
    const line = new AnimatedMeshLine(
      this.base,
      Object.assign({}, this.lineStaticProps, props)
    );
    this.lines.push(line);
    this.group.add(line.mesh);
    this.nbrOfLines++;
    return line;
  }

  removeLine(line) {
    this.group.remove(line);
    this.nbrOfLines--;
  }

  /**
   * * *******************
   * * UPDATE
   * * *******************
   */
  update() {
    // Add lines randomly
    if (this.isStarted && Math.random() < this.frequency) {
      this.addLine();
    }

    // Filter and remove died lines
    const filteredLines = [];
    for (this.i = this.nbrOfLines; this.i >= 0; this.i--) {
      if (this.lines[this.i].isDied) {
        this.removeLine(this.lines[this.i]);
      } else {
        filteredLines.push(this.lines[this.i]);
      }
    }
    this.lines = filteredLines;
  }
}

class CustomLineGenerator extends LineGenerator {
  constructor(
    base,
    {
      frequency = 0.1,
      container = null,
      baseCamera = null,
      countLimit = 400,
    } = {},
    lineProps
  ) {
    super(base, { frequency, container }, lineProps);
    this.countLimit = countLimit;
    this.baseCamera = baseCamera || this.base.camera;
  }
  addLine() {
    if (this.lines.length > this.countLimit) {
      return;
    }

    const RADIUS_START = 0.3;
    const RADIUS_START_MIN = 0.1;
    const Z_MIN = -1;

    const Z_INCREMENT = 0.08;
    const RADIUS_INCREMENT = 0.02;
    const ANGLE_INCREMENT = 0.025;

    const COLORS = ["#0243bc", "#fc4ddc", "#07c1b3", "#ca2761"].map(
      (col) => new THREE.Color(col)
    );

    const position = { x: 0, y: 0, z: 0 };

    let z = Z_MIN;
    let radius = Math.random() > 0.8 ? RADIUS_START_MIN : RADIUS_START;
    let angle = THREE.MathUtils.randFloat(0, Math.PI * 2);

    const points = [];
    while (z < this.baseCamera.position.z) {
      position.x = Math.cos(angle) * radius;
      position.y = Math.sin(angle) * radius;
      position.z = z;

      // incrementation
      z += Z_INCREMENT;
      radius += RADIUS_INCREMENT;
      // angle += ANGLE_INCREMENT;

      // push
      points.push(position.x, position.y, position.z);
    }

    // Low lines
    super.addLine({
      visibleLength: THREE.MathUtils.randFloat(0.1, 0.2),
      // visibleLength: 1,
      points,
      // speed: THREE.MathUtils.randFloat(0.001, 0.002),
      speed: THREE.MathUtils.randFloat(0.001, 0.005),
      color: sample(COLORS),
      width: THREE.MathUtils.randFloat(0.01, 0.06),
    });
  }
}

class Sketch extends kokomi.Base {
  async create() {
    const screenCamera = new kokomi.ScreenCamera(this);
    screenCamera.addExisting();

    // new kokomi.OrbitControls(this);

    // Scene1
    const rtScene1 = new THREE.Scene();
    const rtCamera1 = new THREE.PerspectiveCamera(
      60,
      window.innerWidth / window.innerHeight,
      0.01,
      10000
    );
    rtCamera1.position.z = -1000;

    const pointLight = new THREE.PointLight(0xffffff, 1, 0, 2);
    pointLight.position.set(10, 20, 30);
    rtScene1.add(pointLight);

    const urls = [...Array(100).keys()].map((item, i) => {
      return `https://picsum.photos/id/${i}/100/100`;
      // return `https://s2.loli.net/2022/09/08/gGY4VloDAeUwWxt.jpg`;
    });

    const at = new ImageTunnel(this, {
      urls,
      container: rtScene1,
    });
    at.on("ready", () => {
      document.querySelector(".loader-screen").classList.add("hollow");
    });
    await at.addExisting();

    const rt1 = new kokomi.RenderTexture(this, {
      rtScene: rtScene1,
      rtCamera: rtCamera1,
    });

    const quad1 = new kokomi.CustomMesh(this, {
      vertexShader: "",
      fragmentShader: "",
      baseMaterial: new THREE.MeshBasicMaterial(),
      geometry: new THREE.PlaneGeometry(window.innerWidth, window.innerHeight),
      materialParams: {
        map: rt1.texture,
        transparent: true,
      },
    });
    quad1.addExisting();
    quad1.mesh.position.z = -1;

    // Scene2
    const rtScene2 = new THREE.Scene();
    const rtCamera2 = new THREE.PerspectiveCamera(
      70,
      window.innerWidth / window.innerHeight,
      0.01,
      10000
    );
    rtCamera2.position.z = 10;

    const lineGenerator = new CustomLineGenerator(
      this,
      {
        frequency: 0.9,
        countLimit: 200,
        container: rtScene2,
        baseCamera: rtCamera2,
      },
      {}
    );
    lineGenerator.addExisting();
    lineGenerator.start();

    const rt2 = new kokomi.RenderTexture(this, {
      rtScene: rtScene2,
      rtCamera: rtCamera2,
    });

    const quad2 = new kokomi.CustomMesh(this, {
      vertexShader: "",
      fragmentShader: "",
      baseMaterial: new THREE.MeshBasicMaterial(),
      geometry: new THREE.PlaneGeometry(window.innerWidth, window.innerHeight),
      materialParams: {
        map: rt2.texture,
        transparent: true,
      },
    });
    quad2.addExisting();
    quad2.mesh.position.z = -2;
  }
}
