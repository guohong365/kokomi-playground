// https://github.com/junni-inc/next.junni.co.jp/blob/master/src/ts/MainScene/World/Sections/Section2/Transparents/Transparent/shaders/transparent.fs
uniform float iTime;
uniform vec2 iResolution;
uniform vec2 iMouse;

varying vec2 vUv;

uniform sampler2D uTexture;
uniform vec2 uFBOResolution;

varying vec3 vNormal;
varying vec3 vEyeVector;

vec3 saturation(vec3 rgb,float adjustment){
    const vec3 W=vec3(.2125,.7154,.0721);
    vec3 intensity=vec3(dot(rgb,W));
    return mix(intensity,rgb,adjustment);
}

float saturate(float a){
    return clamp(a,0.,1.);
}

float diffuse(vec3 n,vec3 l){
    float diff=saturate(dot(n,l));
    return diff;
}

float specular2(vec3 n,vec3 l,float shininess){
    float spec=pow(saturate(pow(dot(n,l),2.)),shininess);
    return spec;
}

float lighting(vec3 light,vec3 normal,vec3 eyeVector,float d,float s){
    vec3 N=normal;
    vec3 L=normalize(-light);
    vec3 H=normalize(eyeVector+L);
    
    float diff=diffuse(N,L)*d;
    float spec=specular2(N,H,s);
    float lin=diff+spec;
    return lin;
}

float fresnel2(vec3 eyeVector,vec3 worldNormal,float power){
    float fresnelFactor=abs(dot(eyeVector,worldNormal));
    float inversefresnelFactor=1.-fresnelFactor;
    return pow(inversefresnelFactor,power);
}

void main(){
    vec2 p=gl_FragCoord.xy/uFBOResolution.xy;
    
    vec3 col=vec3(0.);
    
    float iorR=1.15;
    float iorY=1.16;
    float iorG=1.18;
    float iorC=1.22;
    float iorB=1.22;
    float iorP=1.22;
    
    float cr=.5;
    float refra=.25;
    float sat=1.14;
    
    vec3 lightPos=vec3(-1.,1.,1.);
    float d=.2;
    float s=15.;
    
    float fr=8.;
    
    for(int i=0;i<SAMPLES;i++){
        float slide=float(i)/float(SAMPLES)*.1;
        
        vec3 refractVecR=refract(vEyeVector,vNormal,(1./iorR));
        vec3 refractVecY=refract(vEyeVector,vNormal,(1./iorY));
        vec3 refractVecG=refract(vEyeVector,vNormal,(1./iorG));
        vec3 refractVecC=refract(vEyeVector,vNormal,(1./iorC));
        vec3 refractVecB=refract(vEyeVector,vNormal,(1./iorB));
        vec3 refractVecP=refract(vEyeVector,vNormal,(1./iorP));
        
        float r=texture(uTexture,p+refractVecR.xy*(refra+slide*1.)*cr).x*.5;
        
        float y=(texture(uTexture,p+refractVecY.xy*(refra+slide*1.)*cr).x*2.+
        texture(uTexture,p+refractVecY.xy*(refra+slide*1.)*cr).y*2.-
        texture(uTexture,p+refractVecY.xy*(refra+slide*1.)*cr).z)/6.;
        
        float g=texture(uTexture,p+refractVecG.xy*(refra+slide*2.)*cr).y*.5;
        
        float c=(texture(uTexture,p+refractVecC.xy*(refra+slide*2.5)*cr).y*2.+
        texture(uTexture,p+refractVecC.xy*(refra+slide*2.5)*cr).z*2.-
        texture(uTexture,p+refractVecC.xy*(refra+slide*2.5)*cr).x)/6.;
        
        float b=texture(uTexture,p+refractVecB.xy*(refra+slide*3.)*cr).z*.5;
        
        float p=(texture(uTexture,p+refractVecP.xy*(refra+slide*1.)*cr).z*2.+
        texture(uTexture,p+refractVecP.xy*(refra+slide*1.)*cr).x*2.-
        texture(uTexture,p+refractVecP.xy*(refra+slide*1.)*cr).y)/6.;
        
        float R=r+(2.*p+2.*y-c)/3.;
        float G=g+(2.*y+2.*c-p)/3.;
        float B=b+(2.*c+2.*p-y)/3.;
        
        col.r+=R;
        col.g+=G;
        col.b+=B;
        
        col=saturation(col,sat);
    }
    
    col/=float(SAMPLES);
    
    float lin=lighting(lightPos,vNormal,vEyeVector,d,s);
    col+=vec3(lin);
    
    float F=fresnel2(vEyeVector,vNormal,fr);
    col+=vec3(F);
    
    csm_DiffuseColor=vec4(col,1.);
    
    // csm_DiffuseColor=vec4(vec3(lin),1.);
    // csm_DiffuseColor=vec4(vec3(F),1.);
}
