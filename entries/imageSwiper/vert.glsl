uniform float iTime;
uniform vec2 iResolution;
uniform vec2 iMouse;

varying vec2 vUv;

uniform float uDevicePixelRatio;
uniform float uDistortion;

vec3 distort(vec3 p){
    float distortion=uDistortion;
    float distortionX=1.75/uDevicePixelRatio/1.1;
    float distortionY=2./uDevicePixelRatio/1.1;
    
    float distanceX=length(p.x)/50.;
    float distanceY=length(p.y)/50.;
    
    float distanceXPow=pow(distortionX,distanceX);
    float distanceYPow=pow(distortionY,distanceY);
    
    p.z-=max(distanceXPow+distanceYPow,2.2)*distortion;
    return p;
}

void main(){
    vec3 p=position;
    p=distort(p);
    gl_Position=projectionMatrix*modelViewMatrix*vec4(p,1.);
    
    vUv=uv;
}