uniform float iTime;
uniform vec2 iResolution;
uniform vec2 iMouse;

varying vec2 vUv;

uniform float uPointSize;

attribute vec4 aRandom;

uniform vec3 uColor;
uniform vec3 uColor2;
uniform float uProgress;

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

highp float random(vec2 co)
{
    highp float a=12.9898;
    highp float b=78.233;
    highp float c=43758.5453;
    highp float dt=dot(co.xy,vec2(a,b));
    highp float sn=mod(dt,3.14);
    return fract(sin(sn)*c);
}

vec3 distort(vec3 p){
    float t=iTime;
    
    float pr=uProgress*1.5-.25*(p.x+aRandom.w);
    
    vColor=vec3(1.);
    vBlur=0.;
    
    float angle=p.x;
    float angle2=floor(p.x*float(SPIRALS))/float(SPIRALS);
    angle=angle2;
    float radiusRatio=p.y;
    radiusRatio=fract(p.y+t*.02);
    float radius=radiusRatio*1.75;
    
    radius*=pr;
    
    angle*=2.*PI;
    angle-=radius*.75;
    
    vec2 dir=vec2(cos(angle),sin(angle));
    p=vec3(dir*radius,radiusRatio);
    
    p.z=cos(radiusRatio*PI*2.)*pow(radiusRatio,2.)*.8*smoothstep(.75,1.,pr);
    
    p.z=pr>.001?p.z:2.;
    
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