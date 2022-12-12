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
router.post('/', createUser);
router.post('/:name', createSchedule);
router.post('/:name/:semesterYear', addEvent)
router.delete('/:name', deleteStudent);
router.delete('/:name/:semesterYear', deleteSchedule);
router.delete('/:name/:semesterYear/:eventName', deleteEvent);
app.use(router);
app.use(errorHandler);
app.listen(port, () => console.log(`Listening on port ${port}`));

//Implement CRUD operations

/*errorHandler()
*handles errors by outputing to the console
*@returns {Error} error - returns any error that occurs with router
*/
function errorHandler(err, req, res) {
    if (app.get('env') === "development") {
        console.log(err);
    }
    res.sendStatus(err.status || 500);
}

/*returnDataOr404()
*throws error status if the data is empty
*@returns data or status
*/
function returnDataOr404(res, data) {
    if (data == null) {
        res.sendStatus(404);
    } else {
        res.send(data);
    }
}

/*readStudents()
*returns all students in database
*@returns json of student names
*/
 function readStudents(req, res, next) {
    db.many("SELECT * FROM Users")
        .then(data => {
            res.send(data);
        })
        .catch(err => {
            next(err);
        })
}

/*readSchedules()
*given a student name ("first last") in req.params, this will return all the schedules for the student
*@params student name
*@returns json of student schedules
*/
function readSchedules(req, res, next) {
    db.many("SELECT * FROM Schedule, Users WHERE Schedule.userID = Users.ID AND Users.name=${name}", req.params)
        .then(data => {
            returnDataOr404(res, data);
        })
        .catch(err => {
            next(err);
        });
}

/*readEvents()
*given a student name ("first last") and a scheduleYear (eg "2023 Fall"), this will return all events in that schedule
*@params student name
*@params semesterYear
*@returns json of events
*/
function readEvents(req, res, next) {
    db.many("SELECT eventID, events.name, events.starttime, events.endtime, daydesignation, events.location, eventLead, scheduleID FROM Events, Schedule, Users WHERE Users.ID=Schedule.userID AND Schedule.ID=Events.scheduleID AND Users.name=${name} AND Schedule.semesterYear=${semesterYear}", req.params)
        .then(data => {
            returnDataOr404(res, data);
        })
        .catch(err => {
            next(err);
        });
}

/*createUser()
*creates a user using id and name given in req.body
*@params id
*@params name
*@returns id or error
*/
function createUser(req, res, next) {
    db.one('INSERT INTO Users(ID, name) VALUES (${id}, ${name}) RETURNING id', req.body)
        .then(data => {
            res.send(data);
        })
        .catch(err => {
            next(err);
        });
}

/*createSchedule()
*creates a schedule using id, semesterYear, userID given in req.body
*@params id
*@params semesterYear
*@params userID
*@returns id or error
*/
function createSchedule(req, res, next) {
    db.one('INSERT INTO Schedule(ID, semesterYear, userID) VALUES (${id}, ${semesterYear}, ${userID}) RETURNING id', req.body)
        .then(data => {
            res.send(data);
        })
        .catch(err => {
            next(err);
        });
}

/*addEvent()
*creates a event using eventID, name, startTime, endTime, dayDesignation, location, eventLead, and scheduleID given in req.body
*@params eventID
*@params startTime
*@params endTime
*@params dayDesignation
*@params location
*@params eventLead
*@params scheduleID
*@returns eventID or error
*/
function addEvent(req, res, next) {
    db.one('INSERT INTO Events(eventID, name, startTime, endTime, dayDesignation, location, eventLead, scheduleID) VALUES (${eventID}, ${name}, ${startTime}, ${endTime}, ${dayDesignation}, ${location}, ${eventLead}, ${scheduleID}) RETURNING eventID', req.body)
        .then(data => {
            res.send(data);
        })
        .catch(err => {
            next(err);
        });
}

/*deleteStudent()
*deletes a student given the student name in req.params
*@params student name
*@returns error or nothing
*/
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

/*deleteSchedule()
*deletes schedule given a student name and semesterYear from req.params
*@params student name
*@params semesterYear
*@returns error or ID
*/
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

/*deleteEvent()
*deletes an event given student name, semesterYear, and event name
*@params student name
*@params semesterYear
*@params event name
*@returns error
*/
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
