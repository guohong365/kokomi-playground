uniform float iTime;
uniform vec2 iResolution;
uniform vec2 iMouse;

varying vec2 vUv;

uniform sampler2D uTexture;

varying vec3 vNormal;
varying vec3 vEyeVector;

// https://github.com/Jam3/glsl-fast-gaussian-blur
vec4 blur9(sampler2D image,vec2 uv,vec2 resolution,vec2 direction){
    vec4 color=vec4(0.);
    vec2 off1=vec2(1.3846153846)*direction;
    vec2 off2=vec2(3.2307692308)*direction;
    color+=texture(image,uv)*.2270270270;
    color+=texture(image,uv+(off1/resolution))*.3162162162;
    color+=texture(image,uv-(off1/resolution))*.3162162162;
    color+=texture(image,uv+(off2/resolution))*.0702702703;
    color+=texture(image,uv-(off2/resolution))*.0702702703;
    return color;
}

#define GLSLIFY 1
// https://www.shadertoy.com/view/4scSW4
float fresnel(float bias,float scale,float power,vec3 I,vec3 N)
{
    return bias+scale*pow(1.+dot(I,N),power);
}

// https://github.com/jamieowen/glsl-blend/blob/master/screen.glsl
float blendScreen(float base,float blend){
    return 1.-((1.-base)*(1.-blend));
}

vec4 blendScreen(vec4 base,vec4 blend){
    return 1.-((1.-base)*(1.-blend));
}

void main(){
    vec2 p=vUv;
    
    float F=fresnel(0.,.6,2.,vEyeVector,vNormal);
    
    // vec4 col=blur9(uTexture,p,iResolution,vec2(1.,0.));
    vec4 col=texture(uTexture,p);
    
    col=blendScreen(col,vec4(F*.1));
    
    csm_DiffuseColor=col;
}