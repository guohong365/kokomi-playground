uniform float iTime;
uniform vec2 iResolution;
uniform vec2 iMouse;

varying vec2 vUv;

uniform float uPointSize;

uniform vec3 uColor;
uniform vec3 uColor2;

varying vec3 vColor;
varying float vBlur;

#define PI 3.141592653589793

float saturate(float a)
{
    return clamp(a,0.,1.);
}

float remap01(float a,float b,float t)
{
    return saturate((t-a)/(b-a));
}

vec2 remap01(vec2 a,vec2 b,vec2 t)
{
    return(t-a)/(b-a);
}

float remap(float a,float b,float c,float d,float t)
{
    return saturate((t-a)/(b-a))*(d-c)+c;
}

vec3 distort(vec3 p){
    float t=iTime;
    
    vColor=vec3(1.);
    vBlur=0.;
    
    float angle=p.x;
    angle=floor(p.x*float(SPIRALS))/float(SPIRALS);
    float radiusRatio=p.y;
    radiusRatio=fract(p.y+t*.02);
    float radius=radiusRatio*1.75;
    
    angle*=2.*PI;
    angle-=radius*.75;
    
    vec2 dir=vec2(cos(angle),sin(angle));
    p=vec3(dir*radius,radiusRatio);
    
    p.z=cos(radiusRatio*PI*2.)*pow(radiusRatio,2.)*.8;
    
    // dof
    vec4 mvPosition=modelViewMatrix*vec4(p,1.);
    float dist=1.35;
    float coc=abs(-mvPosition.z-dist)*.3+pow(max(0.,-mvPosition.z-dist),2.5)*.5+radiusRatio*radiusRatio*1.25;
    
    vColor=mix(uColor2,uColor,saturate(coc+.35));
    
    gl_PointSize=(2.+coc*50.)/-mvPosition.z*iResolution.y/1280.;
    
    vBlur=coc*10.;
    
    return p;
}

void main(){
    vec3 p=position;
    
    gl_PointSize=uPointSize;
    
    p=distort(p);
    
    gl_Position=projectionMatrix*modelViewMatrix*vec4(p,1.);
    
    vUv=uv;
}