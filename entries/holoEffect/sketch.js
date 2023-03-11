import * as kokomi from "kokomi.js";
import * as THREE from "three";
import gsap from "gsap";
import * as dat from "lil-gui";
import * as POSTPROCESSING from "postprocessing";

class HoloEffect extends POSTPROCESSING.Effect {
  constructor({
    blendFunction = POSTPROCESSING.BlendFunction.NORMAL,
    progress = 1,
    glowColor = new THREE.Color("#66ccff"),
    glowColorStrength = 0.3,
  } = {}) {
    super("HoloEffect", fragmentShader, {
      uniforms: new Map([
        ["uProgress", new THREE.Uniform(progress)],
        ["uGlowColor", new THREE.Uniform(glowColor)],
        ["uGlowColorStrength", new THREE.Uniform(glowColorStrength)],
      ]),
      blendFunction,
    });
  }
}

class Sketch extends kokomi.Base {
  create() {
    this.camera.position.set(0, 0, 1.6);

    const controls = new kokomi.OrbitControls(this);
    // controls.controls.autoRotate = true;

    kokomi.beautifyRender(this.renderer);
    this.renderer.toneMappingExposure = 0.8;

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
      human.scale.setScalar(0.1);
      human.geometry.center();

      const material = new THREE.MeshStandardMaterial({
        envMap,
        metalness: 1,
        roughness: 0.28,
      });
      human.material = material;

      // material
      const uj = new kokomi.UniformInjector(this);

      material.onBeforeCompile = (shader) => {
        shader.uniforms = {
          ...shader.uniforms,
          ...uj.shadertoyUniforms,
        };
        material.userData.shader = shader;

        shader.fragmentShader = [
          /* glsl */
          `
          uniform float iTime;

          mat2 rotation2d(float angle){
            float s=sin(angle);
            float c=cos(angle);
            
            return mat2(
                c,-s,
                s,c
            );
        }
        
        mat4 rotation3d(vec3 axis,float angle){
            axis=normalize(axis);
            float s=sin(angle);
            float c=cos(angle);
            float oc=1.-c;
            
            return mat4(
                oc*axis.x*axis.x+c,oc*axis.x*axis.y-axis.z*s,oc*axis.z*axis.x+axis.y*s,0.,
                oc*axis.x*axis.y+axis.z*s,oc*axis.y*axis.y+c,oc*axis.y*axis.z-axis.x*s,0.,
                oc*axis.z*axis.x-axis.y*s,oc*axis.y*axis.z+axis.x*s,oc*axis.z*axis.z+c,0.,
                0.,0.,0.,1.
            );
        }
        
        vec2 rotate(vec2 v,float angle){
            return rotation2d(angle)*v;
        }
        
        vec3 rotate(vec3 v,vec3 axis,float angle){
            return(rotation3d(axis,angle)*vec4(v,1.)).xyz;
        }
          `,
          shader.fragmentShader,
        ].join("\n");

        // https://ycw.github.io/three-shaderlib-skim/dist/#/latest/physical/fragment
        shader.fragmentShader = shader.fragmentShader.replace(
          /* glsl */
          `#include <envmap_physical_pars_fragment>`,
          /* glsl */
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
            reflectVec = normalize( mix( reflectVec, normal, roughness * roughness) );
            reflectVec = inverseTransformDirection( reflectVec, viewMatrix );

            reflectVec = rotate( reflectVec, vec3(0., 0., 1.), iTime * .1 );

            vec4 envMapColor = textureCubeUV( envMap, reflectVec, roughness );
            return envMapColor.rgb * envMapIntensity;
          #else
            return vec3( 0.0 );
          #endif
        }
      #endif
      `
        );
      };

      this.update(() => {
        if (material.userData.shader) {
          uj.injectShadertoyUniforms(material.userData.shader.uniforms);
        }
      });

      // postprocessing
      const createPostprocessing = () => {
        this.scene.background = new THREE.Color("#000000");

        const composer = new POSTPROCESSING.EffectComposer(this.renderer, {
          frameBufferType: THREE.HalfFloatType,
          multisampling: 8,
        });
        this.composer = composer;

        composer.addPass(
          new POSTPROCESSING.RenderPass(this.scene, this.camera)
        );

        // bloom
        const bloom = new POSTPROCESSING.BloomEffect({
          blendFunction: POSTPROCESSING.BlendFunction.ADD,
          luminanceThreshold: 0.05,
          luminanceSmoothing: 0,
          mipmapBlur: true,
          intensity: 3,
          radius: 0.4,
        });
        composer.addPass(new POSTPROCESSING.EffectPass(this.camera, bloom));

        // holo
        const holo = new HoloEffect({
          progress: 0,
        });
        this.holo = holo;
        composer.addPass(new POSTPROCESSING.EffectPass(this.camera, holo));

        this.renderer.autoClear = true;

        this.createDebug();
      };

      createPostprocessing();
    });
  }
  createDebug() {
    const params = {
      progress: 0,
      glowColor: "#66ccff",
      glowColorStrength: 0.3,
    };

    const gui = new dat.GUI();
    gui
      .add(params, "progress")
      .min(0)
      .max(1)
      .step(0.01)
      .onChange((val) => {
        this.holo.uniforms.get("uProgress").value = val;
      });
    gui.addColor(params, "glowColor").onChange((val) => {
      this.holo.uniforms.get("uGlowColor").value = new THREE.Color(val);
    });
    gui
      .add(params, "glowColorStrength")
      .min(0)
      .max(1)
      .step(0.01)
      .onChange((val) => {
        this.holo.uniforms.get("uGlowColorStrength").value = val;
      });
  }
}
