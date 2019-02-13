import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { graphql } from 'react-apollo';
import gql from 'graphql-tag';
import ScrollIntoViewIfNeeded from 'react-scroll-into-view-if-needed';

import ErrorBox from '../shared/ErrorBox';

import ConfidenceSelector from './ConfidenceSelector';
import QuestionReview from './QuestionReview';

import { ALPHABET, KEY_CODE_A, KEY_CODE_Z, MULTIPLE_CHOICE, KEY_CODE_COMMA, KEY_CODE_PERIOD } from '../../constants';
import fragments from '../../fragments';

class QuestionTaker extends Component {

    constructor(props) {
        super(props);
        this.state = {
            error: null,
            isLoading: false,
            selectedOption: null,
            shortAnswer: '',
            confident: null,
            submitted: false,
            // Will get sent from the server after attempting the question
            questionAttempt: null
        };
        this._submitted = false;
        this._handleKeyDown = this._handleKeyDown.bind(this);
    }

    componentDidMount() {
        if (this.props.question.type === MULTIPLE_CHOICE) {
            document.addEventListener('keydown', this._handleKeyDown);
        }
    }

    componentWillUnmount() {
        if (this.props.question.type === MULTIPLE_CHOICE) {
            document.removeEventListener('keydown', this._handleKeyDown);
        }
    }

  // Allow multiple-choice options to be selected by pressing that letter on the keyboard (or ,. to select confidence). This is kind of hacky right now
  _handleKeyDown(e) {
    // If the question has already been answered, don't let the selected answer change (without this, it's kind of entertaining!)
    if (this.state.submitted) { return; }

    // If a modifier key is pressed, ignore (otherwise they can't ctrl+c to copy, etc.)
    if (e.altKey || e.ctrlKey || e.metaKey || e.shiftKey) { return; }

    // Check that the question is loaded and has options
    if (this.props.question && this.props.question.options) {

        // Select confidence with , and . (if an answer has already been selected)
        if (this.state.selectedOption || this.state.shortAnswer !== '') {
            if (e.keyCode === KEY_CODE_COMMA || e.keyCode === KEY_CODE_PERIOD) {
                this.setState({ confident: (e.keyCode === KEY_CODE_COMMA) });
                e.preventDefault();
            }
        }

        let optionIndex = -1;
        // 65 is A, and the letters are sequential afterwards through Z
        if (e.keyCode >= KEY_CODE_A && e.keyCode <= KEY_CODE_Z) {
            optionIndex = e.keyCode - KEY_CODE_A;
        }
        // Filter to non-empty options
        const questionOptions = this.props.question.options.filter(option => option.text.trim() !== '')
        // Make sure there are this many options (If C was pressed, make sure there are ≥ 3 non-empty options)
        if (optionIndex >= 0 && questionOptions.length > optionIndex) {
            // Make sure that the selected option is non-empty
            this.setState({ selectedOption: questionOptions[optionIndex] });
            e.preventDefault();
        }
    }
  }

  async _submit() {
        // If the enter button is pressed really quickly in succession, this could get fired twice before the
        if (this._submitted) { return; }
        this._submitted = true;
        this.setState({ isLoading: true });
        try {
            const result = await this.props.attemptQuestionMutation({
                variables: {
                    quizAttemptId: this.props.quizAttemptId,
                    questionId: this.props.question.id,
                    type: this.props.question.type,
                    optionId: this.state.selectedOption ? this.state.selectedOption.id : null,
                    shortAnswer: this.state.shortAnswer,
                    isConfident: this.state.confident
                }
            });
            if (result.errors && result.errors.length > 0) {
                throw result;
            }
            console.log("question attempt", result.data.attemptQuestion);
            this.setState({ questionAttempt: result.data.attemptQuestion, submitted: true });
            if (this.props.onQuestionCompleted) {
                this.props.onQuestionCompleted();
            }
        } catch (e) {
            let message = 'Please try again later.';
            if (e.errors && e.errors.length > 0) {
                message = e.errors[0].message;
            }
            this.setState({ error: 'Error saving answer: ' + message, isLoading: false });
        }
  }

  render() {
    const questionOptions = this.props.question.options.filter(option => option.text.trim() !== '');
    const isMultipleChoice = (this.props.question.type === MULTIPLE_CHOICE);
    
    if (isMultipleChoice && questionOptions.length === 0) {
        return <ErrorBox><p>There are no options for this question. Please contact your instructor.</p></ErrorBox>;
    }

    if (this.state.error) {
        return <ErrorBox><p>{this.state.error}</p></ErrorBox>;
    }

    let prompt = (
        <div className="notification question-prompt" dangerouslySetInnerHTML={{__html: this.props.question.prompt}}></div>
    );

    // Hide empty options
    let options = questionOptions.map((option, index) => {
        return (<div className="columns is-mobile question-option-container" key={option.id}
            onClick={() => {
                this.setState({ selectedOption: option })
            }}>
            <button className={"column is-1 question-option-letter level-left is-rounded button " + (this.state.selectedOption && this.state.selectedOption.id === option.id ? "is-link" : "")} >
                <span>{ALPHABET[index]}</span>
            </button>
            <span className="column question-option-text level-left" dangerouslySetInnerHTML={{__html: option.text}}></span>
        </div>);
    });

    let shortAnswer = (
        <div className="columns">
            <div className="column is-two-thirds-tablet field">
                <input
                    className="input is-medium"
                    type="text"
                    placeholder="Enter your answer"
                    autoFocus
                    autoComplete="off"
                    autoCorrect="off"
                    autoCapitalize="off"
                    spellCheck="false"
                    value={this.state.shortAnswer}
                    onChange={e => { this.setState({ shortAnswer: e.target.value })}}
                />
            </div>
        </div>
    )

    let confidenceSelector = (
        <ScrollIntoViewIfNeeded>
            <ConfidenceSelector
                onChange={(confident) => { this.setState({ confident }) }}
                confident={this.state.confident} />
        </ScrollIntoViewIfNeeded>
    );

    let submitButton = (
        <ScrollIntoViewIfNeeded>
        <hr />
        <button autoFocus className={"button is-primary is-medium" + (this.state.isLoading ? " is-loading" : "")} onClick={() => this._submit()}>Submit</button>
        </ScrollIntoViewIfNeeded>
    );

    let review = this.state.questionAttempt && <QuestionReview questionAttempt={this.state.questionAttempt} question={this.props.question} />;

    let continueButton = (
        <button autoFocus className="button is-primary is-medium" onClick={this.props.onNextQuestion}>Continue</button>
    );

    // Question answer view
    if (!this.state.submitted) {
        return (
            <div>
                {prompt}
                <br />
                {isMultipleChoice && options}
                {!isMultipleChoice && shortAnswer}
                {(this.state.selectedOption || this.state.shortAnswer !== '') && confidenceSelector}
                {this.state.confident !== null && submitButton}
            </div>
        );
    } else {
        // Question review view
        return (
            <div>
                {review}
                <br />
                {continueButton}
            </div>
        );
    }
  }
}

QuestionTaker.propTypes = {
    quizAttemptId: PropTypes.string.isRequired,
    question: PropTypes.object.isRequired,
    onQuestionCompleted: PropTypes.func,
    onNextQuestion: PropTypes.func.isRequired
};

const ATTEMPT_QUESTION_MUTATION = gql`
  mutation AttemptQuestion(
      $quizAttemptId: ID!,
      $questionId: ID!,
      $type: QuestionType!,
      $optionId: ID,
      $shortAnswer: String,
      $isConfident: Boolean!) {
    attemptQuestion(quizAttemptId: $quizAttemptId, questionId: $questionId, type: $type, optionId: $optionId, shortAnswer: $shortAnswer, isConfident: $isConfident) {
        ...StudentFullQuestionAttempt
    }
  }
  ${fragments.studentFullQuestionAttempt}
`;

export default graphql(ATTEMPT_QUESTION_MUTATION, { name: 'attemptQuestionMutation' })(QuestionTaker)