uniform float iTime;
uniform vec2 iResolution;
uniform vec2 iMouse;

varying vec2 vUv;

uniform vec3 uColor1;
uniform vec3 uColor2;
uniform float uTransparentRate;

varying float vOpacity;
varying float vColorId;
varying float vTransparent;

varying vec3 vPosition;

float spot(vec2 st,float r,float expo){
    return pow(r/distance(st,vec2(.5)),expo);
}

float saturate(float a){
    return clamp(a,0.,1.);
}

void main(){
    vec2 p=gl_PointCoord;
    
    vec3 color=uColor1;
    if(vColorId>.2&&vColorId<.4){
        color=uColor2;
    }
    
    vec3 col=color*vOpacity;
    
    float shape=spot(p,.1,2.5);
    
    float alpha=1.-saturate(abs(vPosition.y*1.6));
    shape*=alpha;
    
    if(vTransparent>uTransparentRate){
        shape*=0.;
    }
    
    gl_FragColor=vec4(col,shape);
}