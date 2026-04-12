const models = require("./models");

const CalendarEvents = models.CalendarEvent;
const UserTargets = models.UserTarget;
const Requests = models.Request;
const TasksLists = models.TasksList;
const Tasks = models.Task;
const TaskChecklists = models.TaskChecklist;
const TaskFiles = models.TaskFile;
const TaskHistories = models.TaskHistory;
const Notifications = models.Notification;
const Chats = models.Chat;
const ChatMessages = models.ChatMessage;
const Form = models.Form;
const FormField = models.FormField;
const Departments = models.Department;
const FormDepartment = models.FormDepartment;
const TaskField = models.TaskField;
const TaskForm = models.TaskForm;
const TaskStep = models.TaskStep;
const TaskTemplate = models.TaskTemplate;
const TaskFieldValue = models.TaskFieldValue;
const Applicant = models.Applicant;
const ObservationApplicant = models.ObservationApplicant;
const JobPosition = models.JobPosition;

module.exports = {
    CalendarEvents,
    UserTargets,
    Requests,
    TasksLists,
    Tasks,
    TaskChecklists,
    TaskFiles,
    TaskHistories,
    Notifications,
    Chats,
    ChatMessages,
    Form,
    FormField,
    Departments,
    FormDepartment,
    TaskField,
    TaskForm,
    TaskStep,
    TaskTemplate,
    TaskFieldValue,
    Applicant,
    JobPosition,
    ObservationApplicant
};
