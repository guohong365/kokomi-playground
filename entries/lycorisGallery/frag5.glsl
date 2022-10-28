uniform float iTime;
uniform vec2 iResolution;
uniform vec2 iMouse;

uniform sampler2D tDiffuse;

varying vec2 vUv;

uniform float uProgress;

uniform float uMaskRadius;
uniform float uDevicePixelRatio;
uniform vec2 uMouse;
uniform float uMouseSpeed;

vec2 centerUv(vec2 uv){
    uv=uv*2.-1.;
    return uv;
}

vec2 distort(vec2 p){
    vec2 cp=centerUv(p);
    float center=distance(p,vec2(.5));
    vec2 offset=cp*(1.-center)*uProgress;
    p-=offset;
    return p;
}

float circle(vec2 st,float r,vec2 v){
    float d=length(st-v);
    float c=smoothstep(r-.2,r+.2,d);
    return c;
}

float getCircle(float radius){
    vec2 viewportP=gl_FragCoord.xy/iResolution/uDevicePixelRatio;
    float aspect=iResolution.x/iResolution.y;
    
    vec2 m=iMouse.xy/iResolution.xy;
    
    vec2 maskP=viewportP-m;
    maskP/=vec2(1.,aspect);
    maskP+=m;
    
    float r=radius/iResolution.x;
    float c=circle(maskP,r,m);
    
    return c;
}

#define GLSLIFY 1
vec3 blackAndWhite(vec3 color){
    return vec3((color.r+color.g+color.b)/5.);
}

vec4 RGBShift(sampler2D t,vec2 rUv,vec2 gUv,vec2 bUv,float isBlackWhite){
    vec4 color1=texture(t,rUv);
    vec4 color2=texture(t,gUv);
    vec4 color3=texture(t,bUv);
    if(isBlackWhite==1.){
        color1.rgb=blackAndWhite(color1.rgb);
        color2.rgb=blackAndWhite(color2.rgb);
        color3.rgb=blackAndWhite(color3.rgb);
    }
    vec4 color=vec4(color1.r,color2.g,color3.b,color2.a);
    return color;
}

void main(){
    vec2 p=vUv;
    p=distort(p);
    
    float mask=1.-getCircle(uMaskRadius/uDevicePixelRatio);
    float r=mask*uMouseSpeed*.5;
    float g=mask*uMouseSpeed*.525;
    float b=mask*uMouseSpeed*.55;
    vec4 tex=RGBShift(tDiffuse,p+=r,p+=g,p+=b,0.);
    
    vec4 col=tex;
    
    gl_FragColor=col;
}