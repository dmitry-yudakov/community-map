import React, { useState } from 'react';
import { List, Form, Button } from 'semantic-ui-react';
import './Comments.css';
import { ObjectComment, reportError, AuthorWidget } from '..';

const CommentView: React.FC<{ comment: ObjectComment }> = ({ comment: c }) => {
  const { author, comment, created } = c;
  return (
    <List.Item>
      <List.Content>
        <List.Description>
          <AuthorWidget userId={author} />
          {' on '}
          {new Date(created).toLocaleString()}
        </List.Description>
        <List.Header>{comment}</List.Header>
      </List.Content>
    </List.Item>
  );
};

export const CommentsList: React.FC<{ comments: ObjectComment[] }> = ({
  comments,
}) => {
  return (
    <List relaxed divided size="big" className="comments-list">
      {comments.map((c) => (
        <CommentView key={c.id} comment={c} />
      ))}
    </List>
  );
};

export const PostCommentWidget: React.FC<{
  onComment: (comment: string) => Promise<any>;
}> = ({ onComment }) => {
  const [comment, setComment] = useState<string | null>(null);
  return (
    <div
      onClick={(e) => {
        // when put into map item click in form input causes the item to expand
        e.stopPropagation();
      }}
    >
      <Form
        onSubmit={(e) => {
          e.preventDefault();
          !!comment &&
            onComment(comment)
              .then(() => setComment(null))
              .catch(reportError);
        }}
      >
        <Form.Input
          value={comment || ''}
          placeholder="Your comment here"
          action={<Button icon="send" />}
          onChange={(e) => setComment(e.target.value)}
        />
      </Form>
    </div>
  );
};
