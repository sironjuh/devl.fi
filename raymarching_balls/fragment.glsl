precision mediump float;

uniform vec2 u_resolution;
uniform float u_time;

float time = u_time * .001;

float sdSphere(vec3 point, float radius) {
    return length(point) - radius;
}

float sdf(vec3 p) {
    return sdSphere(p, 0.3);
}

// https://www.iquilezles.org/www/articles/normalsSDF/normalsSDF.htm
vec3 calcNormal(in vec3 p) {
    const float eps = 0.0001;
    const vec2 h = vec2(eps,0);
    return normalize(vec3(sdf(p+h.xyy) - sdf(p-h.xyy),
                          sdf(p+h.yxy) - sdf(p-h.yxy),
                          sdf(p+h.yyx) - sdf(p-h.yyx)));
}

void main() {
    vec2 uv = gl_FragCoord.xy / u_resolution.xy;
    vec3 camPos = vec3(0., 0., 2.);
    vec3 ray = normalize(vec3((uv - vec2(.5)), -1));

    // start from camera position
    vec3 rayPos = camPos;
    float t = 0.;
    float tMax = 5.;
    vec3 currentPos;

    // limit to 256 iterations
    for(int i = 0; i < 256; ++i) {
        currentPos = camPos + t * ray;
        float h = sdf(currentPos);

        if(h < 0.0001 || t > tMax) break;
        t += h;
    }

    vec3 color = vec3(0.);

    if(t < tMax) {
        vec3 normal = calcNormal(currentPos);
        color = vec3(normal);
    }

    gl_FragColor = vec4(color, 1.);
}
