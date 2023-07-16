'use client';

import { Button } from '@/components/ui/Button';
import { useCustomToast } from '@/hooks/use-custom-toast';
import { toast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { CommentVoteRequest } from '@/lib/validators/vote';
import { usePrevious } from '@mantine/hooks';
import { CommentVote, VoteType } from '@prisma/client';
import { useMutation } from '@tanstack/react-query';
import axios, { AxiosError } from 'axios';
import { ArrowBigDownIcon, ArrowBigUpIcon } from 'lucide-react';
import { FC, useEffect, useState } from 'react';

type PartialVote = Pick<CommentVote, 'type'>;
interface CommentVoteProps {
  commentId: string;
  initialVotesAmt: number;
  initialVote?: PartialVote;
}

const CommentVote: FC<CommentVoteProps> = ({
  commentId,
  initialVotesAmt,
  initialVote,
}) => {
  const { loginToast } = useCustomToast();
  const [votesAmt, setVotesAmt] = useState<number>(initialVotesAmt);
  const [currentVote, setCurrentVote] = useState(initialVote);
  const prevVote = usePrevious(currentVote);

  // this is client component so we need to synchronize this with server
  useEffect(() => {
    setCurrentVote(initialVote);
  }, [initialVote]);

  const { mutate: vote } = useMutation({
    mutationFn: async (voteType: VoteType) => {
      // payload

      const payload: CommentVoteRequest = {
        commentId,
        voteType,
      };

      // updating by patch request as we don't want to send the whole post object to the server just to update the votes field in the db request body

      await axios.patch('/api/community/post/comment/vote', payload);
    },

    onMutate: type => {
      if (currentVote?.type === type) {
        setCurrentVote(undefined);
        if (type === 'UPVOTE') setVotesAmt(prev => prev - 1);
        else if (type === 'DOWNVOTE') setVotesAmt(prev => prev + 1);
      } else {
        setCurrentVote({ type });
        if (type === 'UPVOTE')
          setVotesAmt(prev => prev + (currentVote ? 2 : 1));
        else if (type === 'DOWNVOTE')
          setVotesAmt(prev => prev - (currentVote ? 2 : 1));
      }
    },
  });

  return (
    <div className="flex gap-1">
      {/* upvote */}
      <Button
        onClick={() => vote('UPVOTE')}
        size="sm"
        variant="ghost"
        aria-label="upvote"
      >
        <ArrowBigUpIcon
          className={cn('h-5 w-5 text-zinc-700', {
            // cn helper => conditionally apply the classNames
            'text-emerald-500 fill-emerald-500': currentVote?.type === 'UPVOTE',
          })}
        />
      </Button>
      {/* score */}
      <p className="text-center py-2 font-medium text-sm text-zinc-900">
        {votesAmt}
      </p>

      {/* downvote */}
      <Button
        onClick={() => vote('DOWNVOTE')}
        size="sm"
        className={cn({
          'text-emerald-500': currentVote?.type === 'DOWNVOTE',
        })}
        variant="ghost"
        aria-label="downvote"
      >
        <ArrowBigDownIcon
          className={cn('h-5 w-5 text-zinc-700', {
            'text-red-500 fill-red-500': currentVote?.type === 'DOWNVOTE',
          })}
        />
      </Button>
    </div>
  );
};

export default CommentVote;