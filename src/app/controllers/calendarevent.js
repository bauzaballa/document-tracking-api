const { CalendarEvents } = require("@/database/db");
const { Op } = require("sequelize");

const axios = require("axios");
const apiAuth = require("../utils/apiAuth");

class CalendarEvent {
    constructor() {
        this.googleCalendarBaseUrl = "https://www.googleapis.com/calendar/v3";
    }

    /**
     * Create new calendar event
     *
     * @param {import("express").Request} req - Express resquest
     * @param {import("express").Response} res - Express response
     */
    create = async (req, res) => {
        try {
            const data = req.body;
            const newEventData = {
                userId: data.userId,
                title: data.title,
                date: data.date,
                description: data.description,
                notification: data.notification
            };
            if (!data.userId) {
                return res.status(400).send("User ID is required");
            }
            const result = await CalendarEvents.create(newEventData);

            try {
                const accessToken = await this.googleAccessToken(data.userId);

                if (accessToken) {
                    const googleEventData = {
                        summary: data.title,
                        description: data.description,
                        start: {
                            dateTime: new Date(data.date).toISOString(),
                            timeZone: "America/Argentina/Buenos_Aires"
                        },
                        end: {
                            dateTime: new Date(new Date(data.date).getTime() + 60 * 60 * 1000).toISOString(), // +1 hora por default
                            timeZone: "America/Argentina/Buenos_Aires"
                        }
                    };

                    const googleResponse = await axios.post(
                        `${this.googleCalendarBaseUrl}/calendars/primary/events`,
                        googleEventData,
                        {
                            headers: {
                                Authorization: `Bearer ${accessToken}`,
                                Accept: "application/json"
                            }
                        }
                    );

                    result.googleEventId = googleResponse.data.id;
                    await result.save();
                }
            } catch (error) {
                console.log(error);
            }

            res.status(200).send(result);
        } catch (error) {
            res.status(500).send(error);
        }
    };

    /**
     * Update a calendar event
     *
     * @param {import("express").Request} req - Express resquest
     * @param {import("express").Response} res - Express response
     */
    update = async (req, res) => {
        try {
            const data = req.body;
            if (!data.eventId) {
                return res.status(400).send("Event ID is required");
            }
            await CalendarEvents.update(
                {
                    title: data.title,
                    date: data.date,
                    description: data.description,
                    notification: data.notification
                },
                {
                    where: {
                        id: data.eventId
                    }
                }
            );

            try {
                const eventUpdated = await CalendarEvents.findByPk(data.eventId);

                const accessToken = await this.googleAccessToken(data.userId);

                if (accessToken) {
                    const googleEventData = {
                        summary: data.title,
                        description: data.description,
                        start: {
                            dateTime: new Date(data.date).toISOString(),
                            timeZone: "America/Argentina/Buenos_Aires"
                        },
                        end: {
                            dateTime: new Date(new Date(data.date).getTime() + 60 * 60 * 1000).toISOString(),
                            timeZone: "America/Argentina/Buenos_Aires"
                        }
                    };

                    await axios.patch(
                        `${this.googleCalendarBaseUrl}/calendars/primary/events/${eventUpdated.googleEventId}`,
                        googleEventData,
                        {
                            headers: {
                                Authorization: `Bearer ${accessToken}`,
                                Accept: "application/json"
                            }
                        }
                    );
                }
            } catch (error) {
                console.log(error);
            }

            res.sendStatus(200);
        } catch (error) {
            console.log(error);

            res.status(500).send(error);
        }
    };

    /**
     * Delete calendar event
     *
     * @param {import("express").Request} req - Express resquest
     * @param {import("express").Response} res - Express response
     */
    delete = async (req, res) => {
        try {
            const { eventId, userId } = req.query;

            const whereClause = {
                id: eventId
            };

            try {
                const accessToken = await this.googleAccessToken(userId);

                if (accessToken) {
                    const eventToDelete = await CalendarEvents.findByPk(eventId);

                    if (eventToDelete.googleEventId) {
                        await axios.delete(
                            `${this.googleCalendarBaseUrl}/calendars/primary/events/${eventToDelete.googleEventId}`,
                            {
                                headers: {
                                    Authorization: `Bearer ${accessToken}`,
                                    Accept: "application/json"
                                }
                            }
                        );
                    }
                }
            } catch (error) {
                console.log(error);
            }

            await CalendarEvents.destroy({
                where: whereClause
            });

            res.sendStatus(200);
        } catch (error) {
            console.log(error);
            res.status(500).send(error);
        }
    };

    /**
     * Get all events of the month
     *
     * @param {import("express").Request} req - Express resquest
     * @param {import("express").Response} res - Express response
     */
    getEvents = async (req, res) => {
        try {
            const data = req.query;

            const year = parseInt(data.year);
            const month = parseInt(data.month);

            const startDate = new Date(Date.UTC(year, month, 1, 0, 0, 0));
            const endDate = new Date(Date.UTC(year, month + 1, 1, 0, 0, 0));

            const whereClause = {
                userId: data.userId,
                date: {
                    [Op.gte]: startDate,
                    [Op.lt]: endDate
                }
            };

            const result = await CalendarEvents.findAll({
                where: whereClause
            });

            res.status(200).send(result);
        } catch (error) {
            res.status(500).send(error);
        }
    };

    /**
     * Requerimos un access_token válido desde el microservicio de autenticación
     * @param {string} userId
     * @returns {Promise<string>} access_token
     */
    async googleAccessToken(userId) {
        try {
            const { data } = await apiAuth.post("/auth/google/access-token", { userid: userId });

            return data.access_token;
        } catch (error) {
            throw new Error(error.response.data.message || "Error al obtener el access_token de Google");
        }
    }

    /**
     * Get all events of the month
     *
     * @param {import("express").Request} req - Express resquest
     * @param {import("express").Response} res - Express response
     */
    getGoogleEvents = async (req, res) => {
        const { userId, month, year } = req.query;

        try {
            const accessToken = await this.googleAccessToken(userId);

            const timeMin = new Date(Date.UTC(year, month, 1)).toISOString();
            const timeMax = new Date(Date.UTC(year, month + 1, 1)).toISOString();

            const response = await axios.get(`${this.googleCalendarBaseUrl}/calendars/primary/events`, {
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                    Accept: "application/json"
                },
                params: {
                    timeMin,
                    timeMax,
                    singleEvents: true, // aplanar eventos recurrentes
                    orderBy: "startTime"
                }
            });

            res.status(200).send(response.data);
        } catch (error) {
            console.log(error);
            res.status(500).send(error);
        }
    };
}

module.exports = CalendarEvent;
