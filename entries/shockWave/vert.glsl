uniform float iTime;
uniform vec2 iResolution;
uniform vec2 iMouse;

varying vec2 vUv;

attribute float aRandomHeight;
attribute float aRandom;

varying vec3 vWorldPosition;
varying vec3 vNormal;
varying vec3 vViewPosition;

uniform float uOffsetY;

#define GLSLIFY 1
// https://tympanus.net/codrops/2019/10/29/real-time-multiside-refraction-in-three-steps/
vec4 getWorldPosition(mat4 modelMat,vec3 pos){
    vec4 worldPosition=modelMat*vec4(pos,1.);
    return worldPosition;
}

vec3 distort(vec3 p){
    float t=iTime;
    
    float y=0.;
    
    // offset
    y+=aRandomHeight;
    
    // noise
    float noiseVal=0.;
    if(aRandom>0.){
        float randomHigh=step(13.,mod(aRandom,14.));
        noiseVal=sin(t*cos(aRandom*.05)+aRandom)*(.08+randomHigh*.2)+randomHigh*.4;
    }
    y+=noiseVal;
    
    p.y+=y*uOffsetY;
    
    return p;
}

void main(){
    #include <begin_vertex>
    
    transformed=distort(transformed);
    
    #include <project_vertex>
    
    vUv=uv;
    
    vWorldPosition=getWorldPosition(modelMatrix*instanceMatrix,transformed).xyz;
    vNormal=normalMatrix*mat3(instanceMatrix)*normal;
    vViewPosition=-mvPosition.xyz;
}