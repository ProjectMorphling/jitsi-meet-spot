const constants = require('./../constants');

/**
 * Represents a session/connection between SpotTV and SpotRemote instances.
 */
class SpotSession {
    /**
     * Initializes new {@code SpotSession} between TV and remote (there's no connection between
     * the two yet).
     *
     * @param {SpotTV} spotTV - The Spot TV instance that will be part of this session.
     * @param {SpotRemote} spotRemote - The Spot Remote instance that will be part of this session.
     */
    constructor(spotTV, spotRemote) {
        this.spotTV = spotTV;
        this.spotRemote = spotRemote;
    }

    /**
     * Obtains the join code from the {@code SpotTV} and makes the {@code SpotRemote} connect to
     * the TV using the code.
     *
     * @returns {void}
     */
    connectRemoteToTV() {
        this._submitJoinCode();

        const remoteControlPage = this.spotRemote.getRemoteControlPage();

        remoteControlPage.waitForVisible();
    }

    /**
     * Obtains the join code from the {@code SpotTV} and makes the {@code SpotRemote} connect to
     * the TV using the code, but also starts connected in share mode.
     *
     * @returns {void}
     */
    connectScreeshareOnlyRemoteToTV() {
        const queryParams = new Map();

        queryParams.set('share', true);

        this._submitJoinCode({ queryParams });
    }

    /**
     * Disconnects the Spot-TV from the underlying MUC. This method is used to
     * avoid page-load stalls caused by the Spot-TV reusing the same JID
     * between tests and waiting for JID conflicts to resolve.
     *
     * @returns {void}
     */
    forceDisconnectSpotTV() {
        this.spotTV.driver.executeAsync(done => {
            try {
                window.spot.remoteControlServer.disconnect()
                    .then(done, done);
            } catch (e) {
                done();
            }
        });
    }

    /**
     * Disconnects the Spot-Remote from the underlying MUC.
     *
     * @returns {void}
     */
    forceDisconnectSpotRemote() {
        this.spotRemote.driver.executeAsync(done => {
            try {
                window.spot.remoteControlClient.disconnect()
                    .then(done, done);
            } catch (e) {
                done();
            }
        });
    }

    /**
     * Returns the Spot-TV associated with the session.
     *
     * @returns {SpotTV}
     */
    getSpotTV() {
        return this.spotTV;
    }

    /**
     * Returns the Spot-Remove associated with the session.
     *
     * @returns {SpotRemote}
     */
    getSpotRemote() {
        return this.spotRemote;
    }

    /**
     * Checks if backend is enabled in the current test session.
     *
     * @returns {boolean}
     */
    isBackendEnabled() {
        return Boolean(constants.BACKEND_PAIRING_CODE);
    }

    /**
     * The {@code SpotRemote} makes the TV join a meeting with the given name. If a name is not
     * provided the session selects a random one.
     *
     * @param {string} [meetingName] - The name of the meeting to join (optional).
     * @returns {string} - The name of the meeting that the Spot TV tried to join.
     */
    joinMeeting(meetingName) {
        const remoteControlPage = this.spotRemote.getRemoteControlPage();

        remoteControlPage.waitForVisible();

        const testMeetingName = meetingName ? meetingName : `ui-test-${Date.now()}`;
        const meetingInput = remoteControlPage.getMeetingInput();

        meetingInput.submitMeetingName(testMeetingName);

        const meetingPage = this.spotTV.getMeetingPage();

        meetingPage.waitForVisible();

        return testMeetingName;
    }

    /**
     * Disconnects the Spot-Remote and Spot-TV from the underlying MUC.
     *
     * @returns {void}
     */
    resetConnection() {
        this.forceDisconnectSpotTV();
        this.forceDisconnectSpotRemote();
    }

    /**
     * Starts Spot Remote with given join code and extra query params.
     *
     * @param {string} joinCode - The join code to be entered on the join code page.
     * @param {Map} queryParams - Any extra query params to be added to the Spot Remote URL.
     * @returns {void}
     */
    startSpotRemote(joinCode, queryParams) {
        const joinCodePage = this.spotRemote.getJoinCodePage();

        joinCodePage.visit(queryParams);
        joinCodePage.enterCode(joinCode);
    }

    /**
     * Starts the Spot TV and opens the home page(calendar page).
     *
     * @returns {void}
     */
    startSpotTv() {
        const calendarPage = this.spotTV.getCalendarPage();
        const queryParams = new Map();

        queryParams.set('testPermanentPairingCode', constants.BACKEND_PAIRING_CODE || '');

        calendarPage.visit(queryParams, constants.MAX_PAGE_LOAD_WAIT);
    }

    /**
     * Orchestrates the interactions for obtaining the join code from the {@code SpotTV}
     * and submitting it on the join code page of the {@code SpotRemote}.
     *
     * @param {Object} options - Additional configuration to use when initializing the connection
     * between the SpotTV and SpotRemote.
     * @private
     * @returns {void}
     */
    _submitJoinCode(options = {}) {
        this.startSpotTv();

        const joinCode = this.spotTV.getShortLivedPairingCode();

        this.startSpotRemote(joinCode, options.queryParams);
    }
}

module.exports = SpotSession;
