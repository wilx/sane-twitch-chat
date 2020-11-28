import LRUCache from 'lru-cache';
import 'arrive';
import Graphemer from 'graphemer';

/**
 * This determines timeout of how long will fast chat cache keep recent messages.
 * The default is 1.5 seconds. This defends against all the LULW and Pog avalanches
 * that sometimes happen in large Twitch channel chats.
 */
const FAST_CHAT_CACHE_TIMEOUT = 2500;
/**
 * Unlimitted cache size for fast messages.
 */
const FAST_CHAT_CACHE_SIZE = 0;

/**
 * This determines timeout of how long will long messages / copy-pastas be kept in cache.
 */
const LONG_CHAT_CACHE_TIMEOUT = 60 * 1000;
/**
 * Unlimitted cache size for long messages.
 */
const LONG_CHAT_CACHE_SIZE = 0;
/**
 * This determines what is considered a long message / copy-pasta.
 */
const LONG_CHAT_THRESHOLD_LENGTH = 150;

console.log('Starting Sane chat cleanup');

const CHAT_SEL = '.chat-list__list-container, .chat-scrollable-area__message-container';
const CHAT_LINE_SEL = '.chat-line__message';
const SPACE_NORM_RE = /([\s])[\s]+/gu;
const BRAILLE_RE = /^[\u{2800}-\u{28FF}]+$/u;

let prevMessage;
const fastChatCache = new LRUCache({
    max: FAST_CHAT_CACHE_SIZE,
    maxAge: FAST_CHAT_CACHE_TIMEOUT,
    length: () => 1
});
const longChatCache = new LRUCache({
    max: LONG_CHAT_CACHE_SIZE,
    maxAge: LONG_CHAT_CACHE_TIMEOUT,
    length: () => 1
});

const HIDE_MESSAGE_KEYFRAMES = [
    {
        opacity: '1'
    },
    {
        opacity: '0',
        height: '0'
    }
];

const HIDE_MESSAGE_ANIM_OPTS = { duration: 500, fill: 'forwards' };

const SPLITTER = new Graphemer();

async function hideNode (msgNode) {
    msgNode.style.color = '#ff0000';
    const animEffects = new KeyframeEffect(
        msgNode,
        HIDE_MESSAGE_KEYFRAMES,
        HIDE_MESSAGE_ANIM_OPTS
    );
    const anim = new Animation(animEffects, document.timeline);
    anim.onfinish = () => { msgNode.style.display = 'none'; };
    anim.play();
}

function evaluateMessage (combinedMessage, msgNode) {
    if (!combinedMessage) {
        return;
    }

    // Filter repeated messages.
    if (combinedMessage === prevMessage) {
        console.log('Hiding repeated message: ' + combinedMessage);
        hideNode(msgNode);
        return;
    }
    prevMessage = combinedMessage;

    // Filter messages with Braille symbols only.
    if (BRAILLE_RE.test(combinedMessage)) {
        console.log('Hiding Braille only message: ' + combinedMessage);
        hideNode(msgNode);
        return;
    }

    // Filter chat messages which repeat the same text in very short time.
    // See FAST_CHAT_CACHE_TIMEOUT.
    const factCachedNode = fastChatCache.get(combinedMessage);
    if (factCachedNode !== undefined) {
        console.log('Hiding message present in fast chat cache: ' + combinedMessage);
        hideNode(msgNode);
        return;
    }
    fastChatCache.set(combinedMessage, msgNode);

    // Filter long chat messages which repeat within longer period of time.
    const combinedMessageLength = SPLITTER.countGraphemes(combinedMessage);
    if (combinedMessageLength >= LONG_CHAT_THRESHOLD_LENGTH) {
        const longCachedNode = longChatCache.get(combinedMessage);
        if (longCachedNode !== undefined) {
            console.log('Hiding long message / copy-pasta present in long chat cache: ' + combinedMessage);
            hideNode(msgNode);
            return;
        }
        longChatCache.set(combinedMessage, msgNode);
    }
}

document.arrive(CHAT_SEL, (chatNode) => {
    console.log('Sane chat cleanup is enabled.');
    chatNode.arrive(CHAT_LINE_SEL, (msgNode) => {
        const xpathResult = document.evaluate(('descendant::div[contains(@class,"chat-line__message--emote-button")]/span//img'
                + ' | descendant::a[contains(@class,"link-fragment")]'
                + ' | descendant::span[contains(@class,"text-fragment") or contains(@class,"mention-fragment")]//div[contains(@class,"bttv-emote")]/img'
                + ' | descendant::span[contains(@class,"text-fragment") or contains(@class,"mention-fragment")]'),
        msgNode, null, XPathResult.ORDERED_NODE_ITERATOR_TYPE, null);
        const fragments = [];
        for (let node; (node = xpathResult.iterateNext());) {
            if (node.nodeName === 'IMG') {
                const alt = node.getAttribute('alt');
                if (alt) {
                    fragments.push(alt);
                }
            } else {
                fragments.push(node.textContent);
            }
        }
        const combinedMessage = fragments.join(' ').trim().replace(SPACE_NORM_RE, '$1');
        console.log('combined message: ' + combinedMessage);
        evaluateMessage(combinedMessage, msgNode);
    });
});
