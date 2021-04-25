precision highp float;

uniform vec2 u_resolution;
uniform float u_time;

float sdSphere(vec3 p, vec3 pos, float radius) {
    p -= pos;
    return length(p) - radius;
}

mat4 rotationMatrix(vec3 axis, float angle) {
    axis = normalize(axis);
    float s = sin(angle);
    float c = cos(angle);
    float oc = 1.0 - c;
    
    return mat4(oc * axis.x * axis.x + c,           oc * axis.x * axis.y - axis.z * s,  oc * axis.z * axis.x + axis.y * s,  0.0,
                oc * axis.x * axis.y + axis.z * s,  oc * axis.y * axis.y + c,           oc * axis.y * axis.z - axis.x * s,  0.0,
                oc * axis.z * axis.x - axis.y * s,  oc * axis.y * axis.z + axis.x * s,  oc * axis.z * axis.z + c,           0.0,
                0.0,                                0.0,                                0.0,                                1.0);
}

vec3 rotate(vec3 v, vec3 axis, float angle) {
	mat4 m = rotationMatrix(axis, angle);
	return (m * vec4(v, 1.0)).xyz;
}

float displacement(vec3 p) {
    return sin(2. * p.x) * sin(2. * p.y) * sin(2. * p.z);
}

float sdf(vec3 p) {
    vec3 p1 = rotate(p, vec3(sin(u_time), cos(u_time), 1.), u_time / 2.);
    float sphere = sdSphere(p1, vec3(0.), 0.5);
    float d = displacement(p1 - vec3(0.));
    return mix(sphere, d, 0.5); 
}

// https://www.iquilezles.org/www/articles/normalsSDF/normalsSDF.htm
vec3 calcNormal(in vec3 p) {
    const float eps = 0.001;
    const vec2 h = vec2(eps,0);
    return normalize(vec3(sdf(p+h.xyy) - sdf(p-h.xyy),
                          sdf(p+h.yxy) - sdf(p-h.yxy),
                          sdf(p+h.yyx) - sdf(p-h.yyx)));
}

void main() {
    vec2 uv = (gl_FragCoord.xy / u_resolution.xy) - vec2(.5);
    // uv.x *= u_resolution.x / u_resolution.y; // correct aspect ratio
    vec3 camPos = vec3(0., 0., 1.8);
    vec3 ray = normalize(vec3(uv, -1));

    // start from camera position
    vec3 rayPos = camPos;
    float t = 0.;
    float tMax = 5.;
    vec3 currentPos;

    // raymarch, limit to 100 iterations
    for(int i = 0; i < 100; ++i) {
        currentPos = camPos + t * ray;
        float h = sdf(currentPos);
        t += h;
        if(h < 0.0001 || t > tMax) break;
    }

    // add some gradient on background
    vec3 color = vec3(.5 - length(uv - vec2(0.))); // .00625

    if(t < tMax) {
        vec3 normal = calcNormal(currentPos);
        color = vec3(normal);
    }

    gl_FragColor = vec4(color, 1.);
}
