const onVerify = {
    method: 'verify',
}

const onKeyboardUp = {
    method: 'keyboard',
    key: 'up',
    isHold: true
}

const onKeyboardDown = {
    method: 'keyboard',
    key: 'down',
    isHold: true
}

const onKeyboardLeft = {
    method: 'keyboard',
    key: 'left',
    isHold: true
}

const onKeyboardRight = {
    method: 'keyboard',
    key: 'right',
    isHold: true
}

const onKeyboardUpRight = {
    method: 'keyboard',
    key: 'up_right',
    isHold: true
}

const onKeyboardUpLeft = {
    method: 'keyboard',
    key: 'up_left',
    isHold: true
}

const onKeyboardDownRight = {
    method: 'keyboard',
    key: 'down_right',
    isHold: true
}

const onKeyboardDownLeft = {
    method: 'keyboard',
    key: 'down_left',
    isHold: true
}

const onMouse = {
    method: 'mouse',
    clickPosX: 100,
    clickPosY: 100,
    isClicked: true
}

module.exports = {
    onVerify,
    onKeyboardUp,
    onKeyboardDown,
    onKeyboardLeft,
    onKeyboardRight,
    onKeyboardUpRight,
    onKeyboardUpLeft,
    onKeyboardDownRight,
    onKeyboardDownLeft,
    onMouse,
}
