let captionsActive = false;
let captionButtonObserver = null;
let runId = 0;

// Run-once guard
if (window.__yt_subtool_initialized) {
    console.log("yt-subtool already initialized");
} else {
    window.__yt_subtool_initialized = true;

    console.log("yt-subtool INIT (once)");

    // Run again on every video navigation
    window.addEventListener('yt-navigate-finish', () => {
        console.log("yt-subtool NAVIGATION");
        onVideoChange();
    });
}

function isCaptionsEnabled(btn) {
    return btn.getAttribute("aria-pressed") === "true";
}

function waitForCaptionButton(run) {
    console.log(`waitForCaptionButton ${run} ${runId}`)
    if (run !== runId) return; // kill possibly stale loop

    const btn = document.querySelector('.ytp-subtitles-button');

    if (!btn) {
        setTimeout(() => waitForCaptionButton(run), 500);
        return;
    }

    console.log("found subtitles button");

    // Watch for toggle
    function onToggle(btn, run) {
        if (run !== runId) return;
        if (isCaptionsEnabled(btn)) {
            if (!captionsActive) {
                captionsActive = true;
                console.log("captions enabled");
                onCaptionsEnabled(run);
            }
        } else {
            if (captionsActive) {
                captionsActive = false;
                console.log("captions disabled");
            }
        }
    }
    onToggle(btn, run)

    captionButtonObserver = new MutationObserver(() => {
        onToggle(btn, run);
    });

    captionButtonObserver.observe(btn, {
        attributes: true,
        attributeFilter: ['aria-pressed']
    });
}

function onCaptionsEnabled(run) {
    waitForCaptions(run);
}

function onVideoChange() {
    runId++;
    captionsActive = false;
    if (captionButtonObserver) {
        captionButtonObserver.disconnect();
        captionButtonObserver = null;
    }
    console.log("yt-subtool - on video change");
    waitForCaptionButton(runId);
}

function waitForCaptions(run) {
    console.log("yt-subtool - waitForCaptions");
    if (run !== runId) return;

    const caption_window = document.getElementById("ytp-caption-window-container");

    if (!caption_window) {
        console.log("waiting for captions...");
        setTimeout(() => waitForCaptions(run), 500);
        return;
    }

    console.log("found captions");

    setup(caption_window);
}


function setup(caption_window) {
    if (caption_window.__yt_subtool_bound) return;
    caption_window.__yt_subtool_bound = true;

    caption_window.addEventListener("click", async (e) => {
        const target = e.target.closest('.ytp-caption-segment');
        if (target) {
            await navigator.clipboard.writeText(target.innerText);
            console.log("Copied:", target.innerText);
            showClipboardIcon(target);
        }
    });
}


function showClipboardIcon(target) {
    const icon = document.createElement("div");
    icon.textContent = "📋";

    const rect = target.getBoundingClientRect();

    Object.assign(icon.style, {
        position: "fixed",
        left: `${rect.right + 6}px`,
        top: `${rect.top}px`,
        fontSize: "14px",
        opacity: "0",
        transform: "translateY(5px)",
        transition: "opacity 0.2s, transform 0.2s",
        pointerEvents: "none",
        zIndex: 9999
    });

    document.body.appendChild(icon);

    // animate in
    requestAnimationFrame(() => {
        icon.style.opacity = "1";
        icon.style.transform = "translateY(0)";
    });

    // animate out
    setTimeout(() => {
        icon.style.opacity = "0";
        icon.style.transform = "translateY(-5px)";
    }, 400);

    setTimeout(() => {
        icon.remove();
    }, 700);
}