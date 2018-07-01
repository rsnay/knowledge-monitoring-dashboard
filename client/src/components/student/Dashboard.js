import React, { Component } from 'react';
import { Link } from 'react-router-dom';
import { graphql } from 'react-apollo';
import gql from 'graphql-tag';

import ErrorBox from '../shared/ErrorBox';
import LoadingBox from '../shared/LoadingBox';
import mockData from '../../mockData';

class Dashboard extends Component {

  render() {

    if (this.props.quizzesQuery && this.props.quizzesQuery.loading) {
        return <LoadingBox />;
    }

    if (this.props.quizzesQuery && this.props.quizzesQuery.error) {
        return <ErrorBox>Couldn't load quizzes</ErrorBox>;
    }

    const quizzes = this.props.quizzesQuery.quizzes;

    return (
        <section class="section">
        <div class="container">
          <h1 class="title is-inline-block">Student Dashboard</h1>
          <hr />
          <p>For now, take any quiz</p>

          <table class="table is-striped is-hoverable is-fullwidth">
            <thead>
                <tr>
                    <th>ID</th>
                    <th>Quiz Name</th>
                    <th># of Questions</th>
                    <th>Actions</th>
                </tr>
            </thead>
            <tbody>
                {quizzes.map((quiz, index) => 
                    <tr key={index}>
                        <td>{quiz.id}</td>
                        <td>{quiz.title}</td>
                        <td>{quiz.questions.length}</td>
                        <td>
                        <Link to={"/student/quiz/" + quiz.id}
                          className="button is-outlined is-primary">
                            <span class="icon">
                            <i class="fas fa-rocket"></i>
                            </span>
                            <span>Take Quiz</span>
                        </Link>
                        </td>
                    </tr>
                )}
            </tbody>
        </table>
        </div>
      </section>
    )
  }
}

export const QUIZZES_QUERY = gql`
    query {
        quizzes {
            id
            title
            questions {
            id
            prompt
            }
        }
    }
`

export default graphql(QUIZZES_QUERY, {name: 'quizzesQuery'}) (Dashboard)