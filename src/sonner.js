import { getAsset } from "./libs/assets.js";
import { genid } from "./libs/generateId.js";

const VISIBLE_TOASTS_AMOUNT = 3;
const VIEWPORT_OFFSET = "32px";
const TOAST_LIFETIME = 4000;
const TOAST_WIDTH = 356;
const GAP = 14;
const SWIPE_THRESHOLD = 20;
const TIME_BEFORE_UNMOUNT = 200;

export class Sonner {

    static init = ( closeButton = false, richColors = false, position = "bottom-right", ) => {
        if (Sonner.reinitializeToaster()) {
            return;
        }

        Sonner.renderToaster({ closeButton, richColors, position });
        // loadSonnerStyles();

        const ol = document.getElementById("sonner-toaster-list");
        Sonner.registerMouseOver(ol);
        Sonner.registerKeyboardShortcuts(ol);
    }

    static success = (msg) => {
        Sonner.show(msg, { type: "success" });
    }

    static error = (msg) =>{
        Sonner.show(msg, { type: "error" });
    }

    static info = (msg) =>{
        Sonner.show(msg, { type: "info" });
    }

    static warning = (msg) =>{
        Sonner.show(msg, { type: "warning" });
    }

    static show = (msg, { description, type } = {}) => {
        const list = document.getElementById("sonner-toaster-list");
        const { toast, id } = Sonner.renderToast(list, msg, { description, type });

        // Wait for the toast to be mounted before registering swipe events
        window.setTimeout(function () {
            const el = list.children[0];
            const height = el.getBoundingClientRect().height;

            el.setAttribute("data-mounted", "true");
            el.setAttribute("data-initial-height", height);
            el.style.setProperty("--initial-height", `${height}px`);
            list.style.setProperty("--front-toast-height", `${height}px`);

            Sonner.registerSwipe(id);
            Sonner.refreshProperties();
            Sonner.registerRemoveTimeout(el);
        }, 16);
    }

    static remove = (id) => {
        const el = document.querySelector(`[data-id="${id}"]`);
        if (!el) return;
        el.setAttribute("data-removed", "true");
        Sonner.refreshProperties();

        const previousTid = el.getAttribute("data-unmount-tid");
        if (previousTid) window.clearTimeout(previousTid);

        const tid = window.setTimeout(function () {
            el.parentElement?.removeChild(el);
        }, TIME_BEFORE_UNMOUNT);
        el.setAttribute("data-unmount-tid", tid);
    }

    static reinitializeToaster = () => {
        const ol = document.getElementById("sonner-toaster-list");
        if (!ol) return;
        for (let i = 0; i < ol.children.length; i++) {
            const el = ol.children[i];
            const id = el.getAttribute("data-id");
            Sonner.registerSwipe(id);
            Sonner.refreshProperties();
            Sonner.registerRemoveTimeout(el);
        }
        return ol;
    }

    static renderToaster = ({ closeButton, richColors, position }) => {
        const el = document.createElement("div");
        document.body.appendChild(el);
        position = position.split("-");
        el.outerHTML = (`
            <section aria-label="Notifications alt+T" tabindex="-1">
                <ol
                    dir="ltr"
                    tabindex="-1"
                    data-sonner-toaster="true"
                    data-theme="light"
                    data-close-button="${closeButton}"
                    data-rich-colors="${richColors}"
                    data-y-position="${position[0]}"
                    data-x-position="${position[1]}"
                    style="--front-toast-height: 0px; --offset: ${VIEWPORT_OFFSET}; --width: ${TOAST_WIDTH}px; --gap: ${GAP}px;"
                    id="sonner-toaster-list"
                ></ol>
            </section>
        `)
    }

    static registerMouseOver = (ol) => {
        ol.addEventListener("mouseenter", function () {
            for (let i = 0; i < ol.children.length; i++) {
                const el = ol.children[i];
                if (el.getAttribute("data-expanded") === "true") continue;
                el.setAttribute("data-expanded", "true");

                Sonner.clearRemoveTimeout(el);
            }
        });
        ol.addEventListener("mouseleave", function () {
            for (let i = 0; i < ol.children.length; i++) {
                const el = ol.children[i];
                if (el.getAttribute("data-expanded") === "false") continue;
                el.setAttribute("data-expanded", "false");

                Sonner.registerRemoveTimeout(el);
            }
        });
    }

    static registerKeyboardShortcuts(ol) {
        window.addEventListener("keydown", function (e) {
            if (e.altKey && e.code === "KeyT") {
                if (ol.children.length === 0) return;
                const expanded = ol.children[0].getAttribute("data-expanded");
                const newExpanded = expanded === "true" ? "false" : "true";
                for (let i = 0; i < ol.children.length; i++) {
                    ol.children[i].setAttribute("data-expanded", newExpanded);
                }
            }
        });
    }

    static renderToast(list, msg, { type, description }) {
        const toast = document.createElement("div");
        list.prepend(toast);
        const id = genid();
        const count = list.children.length;
        const asset = getAsset(type);
        toast.outerHTML = (`
            <li
                aria-live="polite"
                aria-atomic="true"
                role="status"
                tabindex="0"
                data-id="${id}"
                data-type="${type}"
                data-sonner-toast=""
                data-mounted="false"
                data-styled="true"
                data-promise="false"
                data-removed="false"
                data-visible="true"
                data-y-position="${list.getAttribute("data-y-position")}"
                data-x-position="${list.getAttribute("data-x-position")}"
                data-index="${0}"
                data-front="true"
                data-swiping="false"
                data-dismissible="true"
                data-swipe-out="false"
                data-expanded="false"
                style="--index: 0; --toasts-before: ${0}; --z-index: ${count}; --offset: 0px; --initial-height: 0px;"
            >
                ${list.getAttribute("data-close-button") === "true"
                    ? `<button aria-label="Close" data-disabled="" class="absolute top-0.5 right-0.5 border border-neutral-800 text-neutral-800 bg-neutral-100 rounded-sm" onclick="Sonner.remove('${id}')">
                        <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <line x1="18" y1="6" x2="6" y2="18"></line>
                            <line x1="6" y1="6" x2="18" y2="18"></line>
                        </svg>
                    </button>
                `: ""}
                ${asset ? ` <div data-icon="" class=""> ${getAsset(type)} </div>` : ""}
                <div data-content="" class="">
                    <div data-title="" class=""> ${msg} </div>
                    ${description ? `<div data-description="" class="">${description}</div>` : ""}
                </div>
            </li>`
        );
        return { toast, id };
    }


    static registerSwipe(id) {
        const el = document.querySelector(`[data-id="${id}"]`);
        if (!el) return;
        let dragStartTime = null;
        let pointerStart = null;
        const y = el.getAttribute("data-y-position");
        el.addEventListener("pointerdown", function (event) {
            dragStartTime = new Date();
            event.target.setPointerCapture(event.pointerId);
            if (event.target.tagName === "BUTTON") return;
            el.setAttribute("data-swiping", "true");
            pointerStart = { x: event.clientX, y: event.clientY };
        });
        el.addEventListener("pointerup", function (event) {
            pointerStart = null;
            const swipeAmount = Number(
                el.style.getPropertyValue("--swipe-amount").replace("px", "") || 0
            );
            const timeTaken = new Date().getTime() - dragStartTime.getTime();
            const velocity = Math.abs(swipeAmount) / timeTaken;

            // Remove only if threshold is met
            if (Math.abs(swipeAmount) >= SWIPE_THRESHOLD || velocity > 0.11) {
                el.setAttribute("data-swipe-out", "true");
                Sonner.remove(id);
                return;
            }

            el.style.setProperty("--swipe-amount", "0px");
            el.setAttribute("data-swiping", "false");
        });

        el.addEventListener("pointermove", function (event) {
            if (!pointerStart) return;
            const yPosition = event.clientY - pointerStart.y;
            const xPosition = event.clientX - pointerStart.x;

            const clamp = y === "top" ? Math.min : Math.max;
            const clampedY = clamp(0, yPosition);
            const swipeStartThreshold = event.pointerType === "touch" ? 10 : 2;
            const isAllowedToSwipe = Math.abs(clampedY) > swipeStartThreshold;

            if (isAllowedToSwipe) {
                el.style.setProperty("--swipe-amount", `${yPosition}px`);
            } else if (Math.abs(xPosition) > swipeStartThreshold) {
                // User is swiping in wrong direction so we disable swipe gesture
                // for the current pointer down interaction
                pointerStart = null;
            }
        });
    }

    static refreshProperties() {
        const list = document.getElementById("sonner-toaster-list");
        let heightsBefore = 0;
        let removed = 0;
        for (let i = 0; i < list.children.length; i++) {
            const el = list.children[i];
            if (el.getAttribute("data-removed") === "true") {
                removed++;
                continue;
            }
            const idx = i - removed;
            el.setAttribute("data-index", idx);
            el.setAttribute("data-front", idx === 0 ? "true" : "false");
            el.setAttribute(
                "data-visible",
                idx < VISIBLE_TOASTS_AMOUNT ? "true" : "false"
            );
            el.style.setProperty("--index", idx);
            el.style.setProperty("--toasts-before", idx);
            el.style.setProperty("--offset", `${GAP * idx + heightsBefore}px`);
            el.style.setProperty("--z-index", list.children.length - i);
            heightsBefore += Number(el.getAttribute("data-initial-height"));
        }
    }

    static registerRemoveTimeout(el) {
        const tid = window.setTimeout(function () {
            Sonner.remove(el.getAttribute("data-id"));
        }, TOAST_LIFETIME);
        el.setAttribute("data-remove-tid", tid);
    }

    static clearRemoveTimeout(el) {
        const tid = el.getAttribute("data-remove-tid");
        if (tid) window.clearTimeout(tid);
    }
}