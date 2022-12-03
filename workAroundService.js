const pgp = require('pg-promise')();
const db = pgp({
    host: process.env.DB_SERVER,
    port: process.env.DB_PORT,
    database: process.env.DB_USER,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD
});

const express = require('express');
const app = express();
const port = process.env.PORT || 3000;
const router = express.Router();
router.use(express.json());


router.get("/", readStudents);
router.get("/:name", readSchedules);
router.get("/:name/:semesterYear", readEvents);
router.put('/', createUser);
router.put('/:name', createSchedule);
router.put('/:name/:semesterYear', addEvent)
router.delete('/:name', deleteStudent);
router.delete('/:name/:semesterYear', deleteSchedule);
router.delete('/:name/:semesterYear/:eventName', deleteEvent);
app.use(router);
app.use(errorHandler);
app.listen(port, () => console.log(`Listening on port ${port}`));

// Implement the CRUD operations.

function errorHandler(err, req, res) {
    if (app.get('env') === "development") {
        console.log(err);
    }
    res.sendStatus(err.status || 500);
}

function returnDataOr404(res, data) {
    if (data == null) {
        res.sendStatus(404);
    } else {
        res.send(data);
    }
}

 function readStudents(req, res, next) {
    db.many("SELECT * FROM Users")
        .then(data => {
            res.send(data);
        })
        .catch(err => {
            next(err);
        })
}

function readSchedules(req, res, next) {
    db.many("SELECT * FROM Schedule, Users WHERE Schedule.userID = Users.ID AND Users.name=${name}", req.params)
        .then(data => {
            returnDataOr404(res, data);
        })
        .catch(err => {
            next(err);
        });
}

function readEvents(req, res, next) {
    db.many("SELECT eventID, events.name, events.starttime, events.endtime, daydesignation, events.location, eventLead, scheduleID FROM Events, Schedule, Users WHERE Users.ID=Schedule.userID AND Schedule.ID=Events.scheduleID AND Users.name=${name} AND Schedule.semesterYear=${semesterYear}", req.params)
        .then(data => {
            returnDataOr404(res, data);
        })
        .catch(err => {
            next(err);
        });
}

function createUser(req, res, next) {
    db.one('INSERT INTO Users(ID, name) VALUES (${id}, ${name}) RETURNING id', req.body)
        .then(data => {
            res.send(data);
        })
        .catch(err => {
            next(err);
        });
}

function createSchedule(req, res, next) {
    db.one('INSERT INTO Schedule(ID, semesterYear, userID) VALUES (${id}, ${semesterYear}, ${userID}) RETURNING id', req.body)
        .then(data => {
            res.send(data);
        })
        .catch(err => {
            next(err);
        });
}

function addEvent(req, res, next) {
    db.one('INSERT INTO Events(eventID, name, startTime, endTime, dayDesignation, location, eventLead, scheduleID) VALUES (${eventID}, ${name}, ${startTime}, ${endTime}, ${dayDesignation}, ${location}, ${eventLead}, ${scheduleID}) RETURNING eventID', req.body)
        .then(data => {
            res.send(data);
        })
        .catch(err => {
            next(err);
        });
}

function deleteStudent(req, res, next) {
    db.oneOrNone('DELETE FROM Events USING Schedule, Users WHERE Schedule.ID=Events.scheduleID AND '
    +'Users.ID=Schedule.userID AND Users.name=${name}; '
    +'DELETE FROM Schedule USING Users WHERE Users.ID=Schedule.userID AND Users.name=${name};'
    +'DELETE FROM Users WHERE name=${name}', req.params)
        .then(data => {
            returnDataOr404(res, data);
        })
        .catch(err => {
            next(err);
        });
}

function deleteSchedule(req, res, next) {
    db.oneOrNone('DELETE FROM Events USING Schedule, Users WHERE Schedule.ID=Events.scheduleID AND '
    +'Users.ID=Schedule.userID AND Users.name=${name} AND Schedule.semesterYear=${semesterYear}; '
    +'DELETE FROM Schedule USING Users WHERE Users.ID=Schedule.userID AND Users.name=${name} AND '
    +'Schedule.semesterYear=${semesterYear} RETURNING ID;', req.params)
        .then(data => {
            returnDataOr404(res, data);
        })
        .catch(err => {
            next(err);
        });
}

function deleteEvent(req, res, next) {
    db.oneOrNone('DELETE FROM Events USING Schedule, Users WHERE Schedule.userID=Users.ID AND '
    +'Events.scheduleID=Schedule.ID AND Schedule.semesterYear=${semesterYear} AND Users.name=${name} '
    +'AND Events.name=${eventName}', req.params)
        .then(data => {
            returnDataOr404(res, data);
        })
        .catch(err => {
            next(err);
        });
}
