import * as kokomi from "kokomi.js";
import * as THREE from "three";
import gsap from "gsap";
import * as dat from "lil-gui";
import * as POSTPROCESSING from "postprocessing";

class HoloEffect extends POSTPROCESSING.Effect {
  constructor({ blendFunction = POSTPROCESSING.BlendFunction.NORMAL }) {
    super("HoloEffect", fragmentShader, {
      uniforms: new Map([["progress", new THREE.Uniform(0)]]),
      blendFunction,
    });
  }
}

class Sketch extends kokomi.Base {
  create() {
    this.camera.position.set(-0.6, 0, 1.5);

    const controls = new kokomi.OrbitControls(this);
    controls.controls.autoRotate = true;

    kokomi.optimizeModelRender(this.renderer);

    const am = new kokomi.AssetManager(
      this,
      [
        {
          name: "model",
          type: "gltfModel",
          path: "../../assets/human.glb",
        },
        {
          name: "hdrTex",
          type: "texture",
          path: "https://s2.loli.net/2023/01/11/27WcYHLKewifuQt.jpg",
        },
      ],
      {
        useDracoLoader: true,
      }
    );

    am.on("ready", () => {
      document.querySelector(".loader-screen").classList.add("hollow");

      // env
      const envMap = kokomi.getEnvmapFromHDRTexture(
        this.renderer,
        am.items["hdrTex"]
      );

      // model
      const model = am.items["model"];
      this.scene.add(model.scene);

      const modelParts = kokomi.flatModel(model.scene);
      kokomi.printModel(modelParts);

      const human = modelParts[1];
      const humanMat = new THREE.MeshStandardMaterial({
        envMap,
        metalness: 1,
        roughness: 0.28,
      });
      human.material = humanMat;

      human.scale.setScalar(0.1);
      human.geometry.center();

      // modify
      const uj = new kokomi.UniformInjector(this);

      humanMat.onBeforeCompile = (shader) => {
        shader.uniforms = {
          ...shader.uniforms,
          ...uj.shadertoyUniforms,
        };

        shader.fragmentShader = `
        uniform float iTime;
        mat4 rotationMatrix(vec3 axis, float angle) {
          axis = normalize(axis);
          float s = sin(angle);
          float c = cos(angle);
          float oc = 1.0 - c;
          
          return mat4(oc * axis.x * axis.x + c,           oc * axis.x * axis.y - axis.z * s,  oc * axis.z * axis.x + axis.y * s,  0.0,
                      oc * axis.x * axis.y + axis.z * s,  oc * axis.y * axis.y + c,           oc * axis.y * axis.z - axis.x * s,  0.0,
                      oc * axis.z * axis.x - axis.y * s,  oc * axis.y * axis.z + axis.x * s,  oc * axis.z * axis.z + c,           0.0,
                      0.0,                                0.0,                                0.0,                                1.0);
      }
      
      vec3 rotate(vec3 v, vec3 axis, float angle) {
        mat4 m = rotationMatrix(axis, angle);
        return (m * vec4(v, 1.0)).xyz;
      }

      ${shader.fragmentShader}
        `;

        shader.fragmentShader = shader.fragmentShader.replace(
          `#include <envmap_physical_pars_fragment>`,
          `
          #if defined( USE_ENVMAP )
vec3 getIBLIrradiance( const in vec3 normal ) {
  #if defined( ENVMAP_TYPE_CUBE_UV )
    vec3 worldNormal = inverseTransformDirection( normal, viewMatrix );
    vec4 envMapColor = textureCubeUV( envMap, worldNormal, 1.0 );
    return PI * envMapColor.rgb * envMapIntensity;
  #else
    return vec3( 0.0 );
  #endif
}
vec3 getIBLRadiance( const in vec3 viewDir, const in vec3 normal, const in float roughness ) {
  #if defined( ENVMAP_TYPE_CUBE_UV )
    vec3 reflectVec = reflect( - viewDir, normal );
    // Mixing the reflection with the normal is more accurate and keeps rough objects from gathering light from behind their tangent plane.
    reflectVec = normalize( mix( reflectVec, normal, roughness * roughness) );
    reflectVec = inverseTransformDirection( reflectVec, viewMatrix );

    reflectVec = rotate(reflectVec, vec3(1.0, 0.0, 0.0), iTime);
    vec4 envMapColor = textureCubeUV( envMap, reflectVec, roughness );
    return envMapColor.rgb * envMapIntensity;
  #else
    return vec3( 0.0 );
  #endif
}
#endif
`
        );

        humanMat.userData.shader = shader;
      };

      this.update(() => {
        if (humanMat.userData.shader) {
          uj.injectShadertoyUniforms(humanMat.userData.shader.uniforms);
        }
      });

      // lights
      const light1 = new THREE.AmbientLight(0xffffff, 0.5);
      this.scene.add(light1);

      const light2 = new THREE.DirectionalLight(0xffffff, 0.5);
      light2.position.set(0.5, 0, 0.866);
      this.scene.add(light2);

      // postprocessing
      this.scene.background = new THREE.Color("#000000");

      const composer = new POSTPROCESSING.EffectComposer(this.renderer);
      composer.addPass(new POSTPROCESSING.RenderPass(this.scene, this.camera));

      // bloom
      const bloom = new POSTPROCESSING.BloomEffect({
        luminanceThreshold: 0.2,
        luminanceSmoothing: 0,
        mipmapBlur: true,
        intensity: 3,
        radius: 0.85,
      });
      composer.addPass(new POSTPROCESSING.EffectPass(this.camera, bloom));

      // holo
      const holo = new HoloEffect({});
      composer.addPass(new POSTPROCESSING.EffectPass(this.camera, holo));

      this.composer = composer;

      // anime
      let t1 = gsap.timeline({
        repeat: -1,
        yoyo: true,
        repeatDelay: 2,
      });
      t1.to(holo.uniforms.get("progress"), {
        value: 1,
        ease: "power1.inOut",
        duration: 1,
      });
    });
  }
}
