uniform float iTime;
uniform vec2 iResolution;
uniform vec2 iMouse;

varying vec2 vUv;

varying vec3 vColor;
varying float vBlur;

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

float spot(vec2 st){
    float d=length(st*2.-1.);
    float result=remap01(0.,vBlur+d,1.-d);
    return result;
}

void main(){
    vec2 p=vUv;
    
    vec3 col=vColor;
    
    float shape=spot(gl_PointCoord);
    
    col*=shape;
    
    gl_FragColor=vec4(col,1.);
}