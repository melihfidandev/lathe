import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { SplitText } from "gsap/SplitText";
import { useGSAP } from "@gsap/react";

// Plugin kayıtları tek yerde; her yer buradan import eder
gsap.registerPlugin(ScrollTrigger, SplitText, useGSAP);
gsap.defaults({ ease: "expo.out" });

export { gsap, ScrollTrigger, SplitText, useGSAP };
