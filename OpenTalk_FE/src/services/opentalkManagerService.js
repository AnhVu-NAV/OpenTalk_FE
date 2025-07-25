import axiosClient from '../api/axiosClient.jsx';
import { getAccessToken } from '../helper/auth.jsx';

export const getMeetings = (params = {}) => {
    const token = getAccessToken();
    return axiosClient.get('/opentalk-meeting', {
        headers: {
            Authorization: `Bearer ${token}`,
        },
        params, 
    });
};


export const getMeetingById = (openTalkMeetingId) => {
    const token = getAccessToken();
    return axiosClient.get(`/opentalk-meeting/${openTalkMeetingId}`, {
        headers: {
            Authorization: `Bearer ${token}`,
        },
    });
};

export const createMeeting = (meetingData) => {
    const token = getAccessToken();
    return axiosClient.post('/opentalk-meeting', meetingData, {
        headers: {
            Authorization: `Bearer ${token}`,
        },
    });
};

export const updateMeeting = (openTalkMeetingId, meetingData) => {
    const token = getAccessToken();
    return axiosClient.put(`/opentalk-meeting/${openTalkMeetingId}`, meetingData, {
        headers: {
            Authorization: `Bearer ${token}`,
        },
    });
};

export const deleteMeeting = (openTalkMeetingId) => {
    const token = getAccessToken();
    return axiosClient.delete(`/opentalk-meeting/${openTalkMeetingId}`, {
        headers: {
            Authorization: `Bearer ${token}`,
        },
    });
};

export const getCompanyBranches = () => {
    const token = getAccessToken();
    return axiosClient.get('/company-branch', {
        headers: {
            Authorization: `Bearer ${token}`,
        },
    });
};

export const generateCheckinCode = (meetingId, validMinutes = 15) => {
    const token = getAccessToken();
    return axiosClient.post('/attendance/generate-checkin-code', null, {
        headers: {
            Authorization: `Bearer ${token}`,
        },
        params: {
            meetingId,
            validMinutes,
        },
    });
};

export const getCheckinCode = (meetingId) => {
    const token = getAccessToken();
    return axiosClient.get(`/attendance/checkin-code`, {
        params: { meetingId }, 
        headers: {
            Authorization: `Bearer ${token}`,
        },
    });
};

export const getTopics = (params = {}) => {
    const token = getAccessToken();
    return axiosClient.get('/topic-idea', {
        headers: {
            Authorization: `Bearer ${token}`,
        },
        params,
    });
};

export const autoSelectHost = (meetingId) => {
    const token = getAccessToken();
    return axiosClient.get(`/hosts/auto-select-host/${meetingId}`, {
        headers: {
            Authorization: `Bearer ${token}`,
        }
    });
};
