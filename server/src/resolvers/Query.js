function quizzes(root, args, context, info) {
    return context.db.query.quizzes({}, info)
}

function users(root, args, context, info){
    return context.db.query.users({}, info)
}

function course(root, args, context, info){
    return context.db.query.course({}, info)
}

function courses(root, args, context, info){
    return context.db.query.courses({}, info)
}

function user(root, args, context, info){
    return context.db.query.user({where:{id:args.id}},info)
}

function quiz(root, args, context, info) {
  return context.db.query.quiz({where:{id:args.id}}, info)
}

function question(root, args, context, info){
  return context.db.query.question({where:{id:args.id}}, info)
}

function option(root, args, context, info){
  return context.db.query.option({where:{id:args.id}})
}

module.exports = {
  quizzes,
  users,
  courses,
  user,
  course,
  quiz,
  question,
  option
}