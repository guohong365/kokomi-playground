uniform float iTime;
uniform vec2 iResolution;
uniform vec2 iMouse;

uniform sampler2D tDiffuse;

varying vec2 vUv;

uniform float uCurtain;
uniform float uRGBShift;

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

vec2 distortCurtain(vec2 p){
    // p+=sin(p.x*10.)*.1*uCurtain;
    
    if(p.x<.25){
    }else if(p.x<.5){
        p.x-=.25*uCurtain;
    }else if(p.x<.75){
        p.x-=.35*uCurtain;
    }else{
        p.x-=.65*uCurtain;
    }
    
    // p.x+=uCurtain;
    
    return p;
}

void main(){
    vec2 p=vUv;
    
    p=distortCurtain(p);
    
    // vec4 tex=texture(tDiffuse,p);
    
    vec4 tex=RGBShift(tDiffuse,p+vec2(.1,0)*uRGBShift,p,p-vec2(.1,0)*uRGBShift,0.);
    
    vec4 col=tex;
    
    gl_FragColor=col;
}