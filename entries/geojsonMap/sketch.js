import * as kokomi from "kokomi.js";
import * as THREE from "three";
import gsap from "gsap";
import * as dat from "lil-gui";
import * as d3 from "d3";
import * as POSTPROCESSING from "postprocessing";

class GeoJsonMap extends kokomi.Component {
  constructor(base, geojson, customConfig = {}) {
    super(base);

    this.geojson = geojson;

    const defaultConfig = {
      projection: {
        coord: {
          lng: 120.619585,
          lat: 31.299379,
        },
        scale: 2400,
      },
      color: "#175ed9",
      depth: {
        color: "#1c51ac",
        length: 2,
      },
      line: {
        color: "#40c0f3",
        offset: 0.1,
      },
    };

    const config = { ...defaultConfig, ...customConfig };
    this.config = config;

    const materialMap = new THREE.MeshPhysicalMaterial({
      side: THREE.DoubleSide,
      color: config.color,
      metalness: 0.3,
      roughness: 0.5,
    });
    const materialDepth = new THREE.MeshPhysicalMaterial({
      side: THREE.DoubleSide,
      color: config.depth.color,
    });

    const projection = d3
      .geoMercator()
      .center([config.projection.coord.lng, config.projection.coord.lat])
      .scale(config.projection.scale)
      .translate([0, 0]);
    this.projection = projection;

    const map = new THREE.Group();
    this.map = map;

    const cities = this.geojson["features"];

    const cityMeshes = [];
    this.cityMeshes = cityMeshes;

    const cityCentroids = [];
    this.cityCentroids = cityCentroids;

    cities.forEach((item, j) => {
      const city = new THREE.Group();
      map.add(city);

      const offset = j / cities.length;
      city.position.z = -offset;

      const coordinates = item["geometry"]["coordinates"];

      coordinates.forEach((multiPolygon) => {
        multiPolygon.forEach((polygon) => {
          const shape = new THREE.Shape();

          const vertices = [];

          for (let i = 0; i < polygon.length; i++) {
            const [x, y] = projection(polygon[i]);
            if (i === 0) {
              shape.moveTo(x, -y);
            }
            shape.lineTo(x, -y);

            vertices.push(
              new THREE.Vector3(x, -y, config.depth.length + config.line.offset)
            );
          }

          const extrudeSettings = {
            depth: config.depth.length,
            bevelEnabled: false,
          };

          const geometry = new THREE.ExtrudeGeometry(shape, extrudeSettings);

          const mesh = new THREE.Mesh(geometry, [materialMap, materialDepth]);

          city.add(mesh);

          cityMeshes.push(mesh);

          const lineGeometry = new THREE.BufferGeometry().setFromPoints(
            vertices
          );
          const lineMaterial = new THREE.MeshBasicMaterial({
            color: config.line.color,
          });
          const line = new THREE.Line(lineGeometry, lineMaterial);
          city.add(line);
        });
      });

      const centroid = item["properties"]["centroid"];
      cityCentroids.push(centroid);
    });
  }
  addExisting() {
    this.base.scene.add(this.map);
  }
}

class Sketch extends kokomi.Base {
  async create() {
    const config = {
      map: {
        projection: {
          coord: {
            lng: 120.619585,
            lat: 31.299379,
          },
          scale: 2400,
        },
        color: "#175ed9",
        depth: {
          color: "#1c51ac",
          length: 2,
        },
        line: {
          color: "#40c0f3",
          offset: 0.1,
        },
      },
      light: {
        spotColor: "#479676",
      },
    };

    this.camera.position.set(0, 0, 75);
    this.camera.near = 0.1;
    this.camera.far = 1000;
    this.camera.fov = 50;
    this.camera.updateProjectionMatrix();

    new kokomi.OrbitControls(this);

    const geojson = JSON.parse(
      await new THREE.FileLoader().loadAsync("../../assets/suzhou.json")
    );

    const geoJsonMap = new GeoJsonMap(this, geojson, config.map);
    geoJsonMap.addExisting();

    const g = new THREE.Group();
    this.scene.add(g);
    g.rotation.x = THREE.MathUtils.degToRad(-45);
    g.add(geoJsonMap.map);

    const stage = new kokomi.Stage(this, {
      shadow: false,
      intensity: 2,
    });
    stage.addExisting();

    const spLight1 = new THREE.SpotLight(
      config.light.spotColor,
      1,
      0,
      Math.PI / 3,
      1
    );
    spLight1.position.z = 20;
    spLight1.position.x = 15;
    spLight1.position.y = 60;
    this.scene.add(spLight1);

    // const spLight1Helper = new THREE.SpotLightHelper(spLight1);
    // this.scene.add(spLight1Helper);

    // postprocessing
    const createPostprocessing = () => {
      const composer = new POSTPROCESSING.EffectComposer(this.renderer, {
        frameBufferType: THREE.HalfFloatType,
        multisampling: 8,
      });
      this.composer = composer;

      composer.addPass(new POSTPROCESSING.RenderPass(this.scene, this.camera));

      const bloom = new POSTPROCESSING.BloomEffect({
        blendFunction: POSTPROCESSING.BlendFunction.ADD,
        luminanceThreshold: 0.4,
        luminanceSmoothing: 0.5,
        mipmapBlur: true,
        intensity: 1,
        radius: 0.4,
      });

      const outline = new POSTPROCESSING.OutlineEffect(
        this.scene,
        this.camera,
        {
          blendFunction: POSTPROCESSING.BlendFunction.SCREEN,
          edgeStrength: 1,
          visibleEdgeColor: new THREE.Color(config.map.line.color),
        }
      );
      outline.selection.set(geoJsonMap.cityMeshes);

      const smaa = new POSTPROCESSING.SMAAEffect();

      const effectPass = new POSTPROCESSING.EffectPass(
        this.camera,
        bloom,
        outline,
        smaa
      );
      composer.addPass(effectPass);
    };

    createPostprocessing();
  }
}
