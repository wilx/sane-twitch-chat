let Arrive = require("arrive");
import LRUCache from "lru-cache";

/**
 * This determines timeout of how long will fast chat cache keep recent messages.
 * The default is 1.5 seconds. This defends against all the LULW and Pog avalanches
 * that sometimes happen in large Twitch channel chats.
 */
const FAST_CHAT_CACHE_TIMEOUT = 1500;
const FAST_CHAT_CACHE_SIZE = 50;

/**
 * This determines timeout of how long will long messages / copy-pastas be kept in cache.
 */
const LONG_CHAT_CACHE_TIMEOUT = 30 * 1000;
const LONG_CHAT_CACHE_SIZE = 10;
/**
 * This determines what is considered a long message / copy-pasta.
 */
const LONG_CHAT_THRESHOLD_LENGTH = 150;

console.log('Starting Sane chat cleanup');

const CHAT_SEL = ".chat-list__list-container, .chat-scrollable-area__message-container";
const CHAT_LINE_SEL = ".chat-line__message";
const SPACE_NORM_RE = /([\s])[\s]+/gu;

let prevMessage = undefined;
let fastChatCache = new LRUCache({
    max: FAST_CHAT_CACHE_SIZE,
    maxAge: FAST_CHAT_CACHE_TIMEOUT,
    length: () => 1
});
let longChatCache = new LRUCache({
    max: LONG_CHAT_CACHE_SIZE,
    maxAge: LONG_CHAT_CACHE_TIMEOUT,
    length: () => 1
});

function hideNode(msgNode) {
    let animOpt = { duration: 500, fill: "forwards" };
    new Promise((resolutionFunc, rejectionFunc) => {
        msgNode.style.color = "#ff0000";
        let anim = msgNode.animate([
            {
                opacity: '1'
            },
            {
                opacity: '0',
                height: '0'
            }
        ], animOpt);
        anim.pause();
        anim.onfinish = () => { msgNode.style.display = "none"; };
        anim.play();
        resolutionFunc(true);
    });
}

function evaluateMessage(combinedMessage, msgNode) {
    if (!combinedMessage) {
        return;
    }

    // Filter repeated messages.
    if (combinedMessage === prevMessage) {
        console.log("Hiding repeated message: " + combinedMessage);
        hideNode(msgNode);
        return;
    }
    prevMessage = combinedMessage;

    // Filter chat messages which repeat the same text in very short time.
    // See FAST_CHAT_CACHE_TIMEOUT.
    let factCachedNode = fastChatCache.get(combinedMessage);
    if (factCachedNode !== undefined) {
        console.log("Hiding message present in fast chat cache: " + combinedMessage);
        hideNode(msgNode)
        return;
    }
    fastChatCache.set(combinedMessage, msgNode);

    // Filter long chat messages which repeat within longer period of time.
    if (combinedMessage.length >= LONG_CHAT_THRESHOLD_LENGTH) {
        let longCachedNode = longChatCache.get(combinedMessage);
        if (longCachedNode !== undefined) {
            console.log("Hiding long message / copy-pasta present in long chat cache: " + combinedMessage);
            hideNode(msgNode);
            return;
        }
        longChatCache.set(combinedMessage, msgNode);
    }
}

document.arrive(CHAT_SEL, (chatNode) => {
    console.log('Sane chat cleanup is enabled.');
    chatNode.arrive(CHAT_LINE_SEL, (msgNode) => {
        let xpathResult = document.evaluate('descendant::span[contains(@class,"text-fragment") or contains(@class,"mention-fragment")]'
            + ' | descendant::div[contains(@class,"chat-line__message--emote-button")]/span/img'
            + ' | descendant::a[contains(@class,"link-fragment")]',
            msgNode, null, XPathResult.ORDERED_NODE_ITERATOR_TYPE, null);
        let node;
        let fragments = [];
        while (node = xpathResult.iterateNext()) {
            if (node.nodeName === "IMG") {
                let alt = node.getAttribute("alt");
                if (alt) {
                    fragments.push(alt)
                }
            }
            else {
                fragments.push(node.textContent);
            }
        }
        let combinedMessage = fragments.join(" ").trim().replace(SPACE_NORM_RE, "$1");
        console.log("combined message: " + combinedMessage);
        evaluateMessage(combinedMessage, msgNode);
    });
});
